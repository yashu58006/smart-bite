/* ==========================================
   DASHBOARD — Menu, Search, Filter, Payment
   ========================================== */

if (!requireAuth()) { /* redirected */ }

let allFoods = [];
let currentCategory = 'All';
let searchTerm = '';
let placedOrderId = null;

const CATEGORIES = ['All', 'Main Course', 'Pizza', 'Burgers', 'Pasta', 'Salads', 'Starters', 'Desserts', 'Beverages'];

// Init
document.addEventListener('DOMContentLoaded', async () => {
  setUserName();
  loadCart();
  renderCategoryFilters();
  await loadFoods();
});

// ======= Category Filters =======
function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(cat => `
    <button class="cat-btn ${cat === currentCategory ? 'active' : ''}"
      onclick="selectCategory('${cat}')">${cat === 'All' ? '🍽️ All' : cat}</button>
  `).join('');
}

function selectCategory(cat) {
  currentCategory = cat;
  renderCategoryFilters();
  filterAndRender();
}

// ======= Load Foods =======
async function loadFoods() {
  showLoader(true);
  try {
    allFoods = await api.get('/foods');
    filterAndRender();
  } catch (err) {
    console.error('Failed to load foods:', err);
    document.getElementById('menuGrid').innerHTML = `
      <div style="color:var(--danger);padding:2rem;text-align:center">
        ❌ Failed to load menu. Make sure the server is running.<br>
        <small style="color:var(--text-muted)">${err.message}</small>
      </div>`;
  }
  showLoader(false);
}

function showLoader(show) {
  const loader = document.getElementById('menuLoader');
  if (loader) loader.style.display = show ? 'flex' : 'none';
}

// ======= Search =======
function handleSearch() {
  searchTerm = document.getElementById('searchInput').value.trim();
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) clearBtn.classList.toggle('visible', searchTerm.length > 0);
  filterAndRender();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  searchTerm = '';
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) clearBtn.classList.remove('visible');
  filterAndRender();
}

// ======= Filter & Render =======
function filterAndRender() {
  let filtered = [...allFoods];
  if (currentCategory !== 'All') {
    filtered = filtered.filter(f => f.category === currentCategory);
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.category.toLowerCase().includes(term) ||
      (f.description || '').toLowerCase().includes(term)
    );
  }
  const titleEl = document.getElementById('menuTitle');
  const countEl = document.getElementById('itemCount');
  if (titleEl) titleEl.textContent = currentCategory === 'All' ? 'All Items' : currentCategory;
  if (countEl) countEl.textContent = `(${filtered.length} items)`;
  renderFoodGrid(filtered);
}

// ======= Render food image (real photo or emoji fallback) =======
function renderFoodImage(food) {
  if (food.imageUrl) {
    return `<img src="${food.imageUrl}" alt="${food.name}" 
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
      style="width:100%;height:100%;object-fit:cover;display:block;" />
      <span class="emoji-fallback" style="display:none;font-size:4rem;align-items:center;justify-content:center;width:100%;height:100%">${food.image || '🍽️'}</span>`;
  }
  return `<span style="font-size:4rem">${food.image || '🍽️'}</span>`;
}

function renderFoodGrid(foods) {
  const grid = document.getElementById('menuGrid');
  const noItems = document.getElementById('noItems');
  if (!grid) return;

  if (foods.length === 0) {
    grid.innerHTML = '';
    noItems?.classList.remove('hidden');
    return;
  }
  noItems?.classList.add('hidden');

  grid.innerHTML = foods.map((food, idx) => {
    const qty = getItemQty(food._id);
    return `
      <div class="food-card" style="animation-delay:${idx * 0.04}s">
        <div class="food-card-image">
          ${renderFoodImage(food)}
          <div class="food-cat-tag">${food.category}</div>
        </div>
        <div class="food-card-body">
          <div class="food-card-name">${food.name}</div>
          <div class="food-card-desc">${food.description || 'Delicious food item'}</div>
          <div class="food-card-footer" id="card-footer-${food._id}">
            ${renderCardFooter(food, qty)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ======= Cart Handlers =======
function handleAddToCart(event, foodId) {
  event.stopPropagation();
  const food = allFoods.find(f => f._id === foodId);
  if (!food) return;
  addToCart(food);
  const btn = event.currentTarget;
  btn.classList.add('added');
  btn.textContent = '✓';
  setTimeout(() => refreshSingleCard(foodId), 600);
}

function handleQtyChange(event, foodId, delta) {
  event.stopPropagation();
  changeQty(foodId, delta);
}

// ======= Payment Flow =======
function openPayment() {
  if (cart.length === 0) return;
  renderOrderSummary();
  document.getElementById('paymentModal').classList.add('open');
  closeCart();
}

function closePayment() {
  document.getElementById('paymentModal').classList.remove('open');
}

function renderOrderSummary() {
  const container = document.getElementById('orderSummary');
  if (!container) return;
  const total = getCartTotal();
  const tax = Math.round(total * 0.05);
  const delivery = total > 500 ? 0 : 40;
  const grand = total + tax + delivery;

  container.innerHTML = `
    ${cart.map(i => `
      <div class="order-summary-item">
        <span>${i.image} ${i.name} × ${i.quantity}</span>
        <span>₹${i.price * i.quantity}</span>
      </div>
    `).join('')}
    <div class="order-summary-item">
      <span>GST (5%)</span><span>₹${tax}</span>
    </div>
    <div class="order-summary-item">
      <span>Delivery</span><span>${delivery === 0 ? 'FREE' : '₹' + delivery}</span>
    </div>
    <div class="order-total-line">
      <span>Total Payable</span><span>₹${grand}</span>
    </div>
  `;
}

async function processPayment() {
  const address = document.getElementById('deliveryAddress').value.trim();
  if (!address) {
    document.getElementById('deliveryAddress').style.borderColor = 'var(--danger)';
    document.getElementById('deliveryAddress').focus();
    return;
  }

  const btn = document.getElementById('payBtn');
  btn.textContent = 'Processing...';
  btn.disabled = true;

  const total = getCartTotal();
  const tax = Math.round(total * 0.05);
  const delivery = total > 500 ? 0 : 40;
  const grandTotal = total + tax + delivery;

  const orderItems = cart.map(i => ({
    foodId: i._id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image
  }));

  try {
    await new Promise(r => setTimeout(r, 1200));
    const data = await api.post('/orders', {
      items: orderItems,
      totalAmount: grandTotal,
      deliveryAddress: address
    }, true);

    placedOrderId = data.order._id;
    closePayment();
    showSuccessModal(placedOrderId);
    clearCart();
  } catch (err) {
    alert('❌ Order failed: ' + err.message);
    btn.textContent = 'Pay Now';
    btn.disabled = false;
  }
}

function showSuccessModal(orderId) {
  const el = document.getElementById('confirmedOrderId');
  if (el) el.textContent = orderId.slice(-8).toUpperCase();
  document.getElementById('successModal').classList.add('open');
}

function closeSuccess() {
  document.getElementById('successModal').classList.remove('open');
  document.body.style.overflow = '';
}

function goToOrders() {
  window.location.href = 'orders.html';
}
