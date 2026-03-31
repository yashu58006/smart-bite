/* ==========================================
   ADMIN PANEL LOGIC — with Image Upload
   ========================================== */

let allOrders = [];
let allFoodItems = [];
let selectedImageFile = null;

// ======= Admin Login =======
async function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value;
  const errEl = document.getElementById('adminLoginError');
  errEl.classList.add('hidden');
  if (!email || !pass) {
    errEl.textContent = '⚠️ Please fill in all fields';
    errEl.classList.remove('hidden');
    return;
  }
  try {
    const data = await api.post('/auth/login', { email, password: pass });
    if (!data.user.isAdmin) {
      errEl.textContent = '❌ Access denied. Admin credentials required.';
      errEl.classList.remove('hidden');
      return;
    }
    api.setAuth(data.token, data.user);
    document.getElementById('adminLoginScreen').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    initAdminDashboard();
  } catch (err) {
    errEl.textContent = '❌ ' + err.message;
    errEl.classList.remove('hidden');
  }
}

function adminLogout() {
  api.clearAuth();
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('adminLoginScreen').classList.remove('hidden');
  document.getElementById('adminEmail').value = '';
  document.getElementById('adminPass').value = '';
}

window.addEventListener('DOMContentLoaded', () => {
  if (api.isLoggedIn()) {
    const user = api.getUser();
    if (user && user.isAdmin) {
      document.getElementById('adminLoginScreen').classList.add('hidden');
      document.getElementById('adminDashboard').classList.remove('hidden');
      initAdminDashboard();
    }
  }
  document.getElementById('adminPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') adminLogin();
  });
  // Make img preview clickable
  document.getElementById('imgPreview')?.addEventListener('click', () => {
    document.getElementById('foodImageFile').click();
  });
});

// ======= Dashboard Init =======
async function initAdminDashboard() {
  await loadStats();
  await loadFoods();
}

// ======= Section Navigation =======
function showSection(section) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('section-' + section).classList.remove('hidden');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  const titles = { dashboard: 'Dashboard', foods: 'Menu Items', orders: 'Orders', users: 'Users' };
  document.getElementById('sectionTitle').textContent = titles[section] || section;
  if (section === 'orders') loadAdminOrders();
  if (section === 'users') loadUsers();
  if (section === 'foods') loadFoods();
}

// ======= Stats =======
async function loadStats() {
  try {
    const data = await api.get('/admin/stats', true);
    document.getElementById('statUsers').textContent = data.totalUsers;
    document.getElementById('statOrders').textContent = data.totalOrders;
    document.getElementById('statFoods').textContent = data.totalFoods;
    document.getElementById('statRevenue').textContent = '₹' + (data.totalRevenue || 0).toLocaleString('en-IN');
    renderRecentOrders(data.recentOrders || []);
  } catch (err) { console.error('Stats error:', err); }
}

function renderRecentOrders(orders) {
  const container = document.getElementById('recentOrdersList');
  if (!container) return;
  if (orders.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem">No orders yet.</div>';
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="recent-order-row">
      <span class="customer">👤 ${o.userName || 'User'}</span>
      <span style="color:var(--text-muted);font-size:0.82rem">${o.items?.length || 0} items</span>
      <span class="${getStatusBadgeClass(o.status)} badge">${o.status}</span>
      <span class="amount">₹${o.totalAmount}</span>
    </div>`).join('');
}

// ======= Image Upload Handling =======
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('❌ Image too large. Max size is 5MB.');
    return;
  }
  selectedImageFile = file;
  // Clear URL input
  document.getElementById('foodImageUrl').value = '';
  // Show preview
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('imgPreview');
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
    document.getElementById('imgRemoveBtn').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function handleUrlInput() {
  const url = document.getElementById('foodImageUrl').value.trim();
  if (!url) return;
  // Clear file input
  selectedImageFile = null;
  document.getElementById('foodImageFile').value = '';
  // Show preview
  const preview = document.getElementById('imgPreview');
  preview.innerHTML = `<img src="${url}" alt="Preview" 
    onerror="this.parentElement.innerHTML='<span style=\\'font-size:2rem\\'>❌</span><p style=\\'font-size:0.8rem;color:var(--danger)\\'>Invalid image URL</p>'"
    style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
  document.getElementById('imgRemoveBtn').classList.remove('hidden');
}

function removeImage() {
  selectedImageFile = null;
  document.getElementById('foodImageFile').value = '';
  document.getElementById('foodImageUrl').value = '';
  document.getElementById('imgPreview').innerHTML = `
    <span class="upload-icon">📷</span>
    <p>Click to upload image</p>
    <small>JPG, PNG, WEBP — max 5MB</small>`;
  document.getElementById('imgRemoveBtn').classList.add('hidden');
}

// ======= Foods Management =======
async function loadFoods() {
  try {
    allFoodItems = await api.get('/foods');
    renderFoodsTable();
  } catch (err) { 
    console.error('Load foods error:', err);
    alert('❌ Failed to load Menu. Please ensure the server is running and database is seeded.');
  }
}

function renderFoodsTable() {
  const tbody = document.getElementById('foodsTableBody');
  if (!tbody) return;
  if (allFoodItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No food items found.</td></tr>';
    return;
  }
  tbody.innerHTML = allFoodItems.map(f => `
    <tr>
      <td>
        <div class="table-food-img">
          ${f.imageUrl
            ? `<img src="${f.imageUrl}" alt="${f.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" style="width:52px;height:52px;object-fit:cover;border-radius:8px;display:block;" /><span style="display:none;font-size:1.8rem">${f.image || '🍽️'}</span>`
            : `<span style="font-size:1.8rem">${f.image || '🍽️'}</span>`}
        </div>
      </td>
      <td>
        <strong>${f.name}</strong><br>
        <small style="color:var(--text-muted)">${f.description || ''}</small>
      </td>
      <td><span class="badge badge-preparing">${f.category}</span></td>
      <td style="color:var(--accent);font-weight:700;font-family:var(--font-display)">₹${f.price}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="editFood('${f._id}')">✏️ Edit</button>
          <button class="btn-danger" onclick="deleteFood('${f._id}','${f.name}')">🗑 Delete</button>
        </div>
      </td>
    </tr>`).join('');
}

// ======= Food Modal =======
function openFoodModal() {
  document.getElementById('editFoodId').value = '';
  document.getElementById('foodName').value = '';
  document.getElementById('foodPrice').value = '';
  document.getElementById('foodCategory').value = 'Main Course';
  document.getElementById('foodImage').value = '';
  document.getElementById('foodDescription').value = '';
  document.getElementById('foodImageUrl').value = '';
  document.getElementById('foodModalTitle').textContent = 'Add Food Item';
  document.getElementById('saveFoodBtn').textContent = 'Save Item';
  document.getElementById('foodFormError').classList.add('hidden');
  removeImage();
  document.getElementById('foodModal').classList.add('open');
}

function editFood(id) {
  const food = allFoodItems.find(f => f._id === id);
  if (!food) return;
  document.getElementById('editFoodId').value = food._id;
  document.getElementById('foodName').value = food.name;
  document.getElementById('foodPrice').value = food.price;
  document.getElementById('foodCategory').value = food.category;
  document.getElementById('foodImage').value = food.image || '';
  document.getElementById('foodDescription').value = food.description || '';
  document.getElementById('foodModalTitle').textContent = 'Edit Food Item';
  document.getElementById('saveFoodBtn').textContent = 'Update Item';
  document.getElementById('foodFormError').classList.add('hidden');
  selectedImageFile = null;

  // Show existing image preview
  const preview = document.getElementById('imgPreview');
  const removeBtn = document.getElementById('imgRemoveBtn');
  if (food.imageUrl) {
    document.getElementById('foodImageUrl').value = food.imageUrl.startsWith('http') ? food.imageUrl : '';
    preview.innerHTML = `<img src="${food.imageUrl}" alt="${food.name}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
    removeBtn.classList.remove('hidden');
  } else {
    document.getElementById('foodImageUrl').value = '';
    preview.innerHTML = `<span class="upload-icon">📷</span><p>Click to upload image</p><small>JPG, PNG, WEBP — max 5MB</small>`;
    removeBtn.classList.add('hidden');
  }

  document.getElementById('foodModal').classList.add('open');
}

function closeFoodModal() {
  document.getElementById('foodModal').classList.remove('open');
  removeImage();
}

async function saveFoodItem() {
  const errEl = document.getElementById('foodFormError');
  errEl.classList.add('hidden');

  const name = document.getElementById('foodName').value.trim();
  const price = parseFloat(document.getElementById('foodPrice').value);
  const category = document.getElementById('foodCategory').value;
  const image = document.getElementById('foodImage').value.trim() || '🍽️';
  const description = document.getElementById('foodDescription').value.trim();
  const imageUrlInput = document.getElementById('foodImageUrl').value.trim();
  const editId = document.getElementById('editFoodId').value;

  if (!name || !price || !category) {
    errEl.textContent = '⚠️ Name, price and category are required.';
    errEl.classList.remove('hidden');
    return;
  }
  if (isNaN(price) || price <= 0) {
    errEl.textContent = '⚠️ Please enter a valid price.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('saveFoodBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const token = api.getToken();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('image', image);
    formData.append('description', description);

    // Priority: file upload > URL input
    if (selectedImageFile) {
      formData.append('imageFile', selectedImageFile);
    } else if (imageUrlInput) {
      formData.append('imageUrl', imageUrlInput);
    }

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/foods/${editId}` : '/api/foods';

    const response = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to save');

    closeFoodModal();
    await loadFoods();
    await loadStats();
  } catch (err) {
    errEl.textContent = '❌ ' + err.message;
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = editId ? 'Update Item' : 'Save Item';
  }
}

async function deleteFood(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
  try {
    await api.delete(`/foods/${id}`, true);
    await loadFoods();
    await loadStats();
  } catch (err) {
    alert('❌ Failed to delete: ' + err.message);
  }
}

// ======= Orders Management =======
async function loadAdminOrders() {
  try {
    allOrders = await api.get('/admin/orders', true);
    renderOrdersTable(allOrders);
  } catch (err) { console.error('Load orders error:', err); }
}

function filterOrders() {
  const val = document.getElementById('orderStatusFilter').value;
  const filtered = val ? allOrders.filter(o => o.status === val) : allOrders;
  renderOrdersTable(filtered);
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No orders found.</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><code style="color:var(--secondary-light);font-size:0.8rem">#${o._id.slice(-8).toUpperCase()}</code></td>
      <td><strong>${o.userName || 'Unknown'}</strong><br><small style="color:var(--text-muted)">${o.userEmail || ''}</small></td>
      <td style="max-width:180px">
        ${(o.items || []).slice(0,3).map(i => `<span style="font-size:0.8rem;color:var(--text-muted)">${i.image || ''}${i.name}×${i.quantity}</span>`).join(', ')}
        ${o.items?.length > 3 ? `<span style="color:var(--text-muted)"> +${o.items.length - 3} more</span>` : ''}
      </td>
      <td style="color:var(--accent);font-weight:700">₹${o.totalAmount}</td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${o._id}', this.value)">
          <option ${o.status==='Pending'?'selected':''}>Pending</option>
          <option ${o.status==='Preparing'?'selected':''}>Preparing</option>
          <option ${o.status==='Out for Delivery'?'selected':''}>Out for Delivery</option>
          <option ${o.status==='Completed'?'selected':''}>Completed</option>
          <option ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
      <td style="font-size:0.82rem;color:var(--text-muted)">${formatDate(o.createdAt)}</td>
      <td><span class="${getStatusBadgeClass(o.status)} badge">${o.status}</span></td>
    </tr>`).join('');
}

async function updateOrderStatus(orderId, status) {
  try {
    await api.put(`/admin/orders/${orderId}/status`, { status }, true);
    loadStats();
  } catch (err) { alert('❌ Failed to update status: ' + err.message); }
}

// ======= Users Management =======
async function loadUsers() {
  try {
    const users = await api.get('/admin/users', true);
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No users yet.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map((u, i) => `
      <tr>
        <td style="color:var(--text-muted)">${i + 1}</td>
        <td><strong>${u.name}</strong></td>
        <td style="color:var(--text-secondary)">${u.email}</td>
        <td style="font-size:0.82rem;color:var(--text-muted)">${formatDate(u.createdAt)}</td>
      </tr>`).join('');
  } catch (err) { console.error('Load users error:', err); }
}

// ======= Helpers =======
function getStatusBadgeClass(status) {
  const map = { 'Pending':'badge-pending','Preparing':'badge-preparing','Out for Delivery':'badge-delivery','Completed':'badge-completed','Cancelled':'badge-cancelled' };
  return map[status] || 'badge-pending';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});
