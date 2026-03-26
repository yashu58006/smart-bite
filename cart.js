/* ==========================================
   CART SYSTEM
   ========================================== */

let cart = [];

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem('sf_cart')) || [];
  } catch { cart = []; }
  renderCart();
  updateCartCount();
}

function saveCart() {
  localStorage.setItem('sf_cart', JSON.stringify(cart));
}

function addToCart(food) {
  const existing = cart.find(i => i._id === food._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...food, quantity: 1 });
  }
  saveCart();
  renderCart();
  updateCartCount();
  flashCartBadge();
}

function removeFromCart(id) {
  cart = cart.filter(i => i._id !== id);
  saveCart();
  renderCart();
  updateCartCount();
  refreshCardButtons();
}

function changeQty(id, delta) {
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart();
  renderCart();
  updateCartCount();
  refreshCardButtons();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
  updateCartCount();
  if (typeof refreshAllCards === 'function') refreshAllCards();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function getCartCount() {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

function getItemQty(id) {
  const item = cart.find(i => i._id === id);
  return item ? item.quantity : 0;
}

function updateCartCount() {
  const count = getCartCount();
  const el = document.getElementById('cartCount');
  if (el) el.textContent = count;
}

function flashCartBadge() {
  const btn = document.querySelector('.cart-btn');
  if (!btn) return;
  btn.style.transform = 'scale(1.1)';
  setTimeout(() => btn.style.transform = '', 200);
}

function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartSidebar')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <span>🛒</span>
        <p>Your cart is empty</p>
        <small style="color:var(--text-muted)">Add items from the menu!</small>
      </div>`;
    if (footer) footer.innerHTML = '';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item" id="cart-item-${item._id}">
      <div class="cart-item-icon">${item.image || '🍽️'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(0)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="cart-qty-btn" onclick="changeQty('${item._id}', -1)">−</button>
        <span class="cart-qty-num">${item.quantity}</span>
        <button class="cart-qty-btn" onclick="changeQty('${item._id}', 1)">+</button>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item._id}')" title="Remove">🗑</button>
    </div>
  `).join('');

  const total = getCartTotal();
  const tax = Math.round(total * 0.05);
  const delivery = total > 500 ? 0 : 40;
  const grandTotal = total + tax + delivery;

  if (footer) footer.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0.4rem;margin-bottom:1rem;font-size:0.88rem;">
      <div style="display:flex;justify-content:space-between;color:var(--text-muted)">
        <span>Subtotal</span><span>₹${total}</span>
      </div>
      <div style="display:flex;justify-content:space-between;color:var(--text-muted)">
        <span>GST (5%)</span><span>₹${tax}</span>
      </div>
      <div style="display:flex;justify-content:space-between;color:var(--text-muted)">
        <span>Delivery</span><span>${delivery === 0 ? '<span style="color:var(--success)">FREE</span>' : '₹' + delivery}</span>
      </div>
    </div>
    <div class="cart-total-row">
      <span class="cart-total-label">Grand Total</span>
      <span class="cart-total-price">₹${grandTotal}<span> incl. taxes</span></span>
    </div>
    <button class="btn-primary btn-full" onclick="openPayment()">
      🔒 Proceed to Pay
    </button>
    <button class="btn-secondary btn-full" onclick="clearCart()" style="margin-top:0.5rem;padding:0.5rem;">
      Clear Cart
    </button>
  `;
}

// Refresh the card button for a specific food item
function refreshCardButtons() {
  if (typeof allFoods === 'undefined') return;
  allFoods.forEach(food => refreshSingleCard(food._id));
}

function refreshAllCards() {
  if (typeof allFoods === 'undefined') return;
  allFoods.forEach(food => refreshSingleCard(food._id));
}

function refreshSingleCard(id) {
  const footerEl = document.getElementById(`card-footer-${id}`);
  if (!footerEl) return;
  const qty = getItemQty(id);
  const food = allFoods.find(f => f._id === id);
  if (!food) return;
  footerEl.innerHTML = renderCardFooter(food, qty);
}

function renderCardFooter(food, qty) {
  if (qty === 0) {
    return `
      <span class="food-price">₹${food.price} <span>/ item</span></span>
      <button class="add-to-cart-btn" onclick="handleAddToCart(event, '${food._id}')" title="Add to cart">+</button>
    `;
  }
  return `
    <span class="food-price">₹${food.price} <span>/ item</span></span>
    <div class="qty-control">
      <button class="qty-btn" onclick="handleQtyChange(event,'${food._id}',-1)">−</button>
      <span class="qty-num">${qty}</span>
      <button class="qty-btn" onclick="handleQtyChange(event,'${food._id}',1)">+</button>
    </div>
  `;
}
