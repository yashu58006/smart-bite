/* ==========================================
   ORDERS PAGE — Tracking
   ========================================== */

if (!requireAuth()) { /* redirected */ }

const STATUS_STEPS = ['Pending', 'Preparing', 'Out for Delivery', 'Completed'];
const STATUS_ICONS = { 'Pending': '📋', 'Preparing': '👨‍🍳', 'Out for Delivery': '🛵', 'Completed': '✅', 'Cancelled': '❌' };

document.addEventListener('DOMContentLoaded', async () => {
  setUserName();
  await loadOrders();
});

async function loadOrders() {
  showLoader(true);
  try {
    const orders = await api.get('/orders/my', true);
    showLoader(false);
    if (orders.length === 0) {
      document.getElementById('noOrders').classList.remove('hidden');
      return;
    }
    renderOrders(orders);
  } catch (err) {
    showLoader(false);
    console.error('Failed to load orders:', err);
    document.getElementById('ordersList').innerHTML = `
      <div style="color:var(--danger);text-align:center;padding:2rem">
        ❌ Failed to load orders: ${err.message}
      </div>`;
  }
}

function showLoader(show) {
  const loader = document.getElementById('ordersLoader');
  if (loader) loader.style.display = show ? 'flex' : 'none';
}

function renderOrders(orders) {
  const container = document.getElementById('ordersList');
  if (!container) return;

  container.innerHTML = orders.map((order, idx) => {
    const isCancelled = order.status === 'Cancelled';
    return `
      <div class="order-card" style="animation-delay:${idx * 0.08}s">
        <div class="order-card-header">
          <div>
            <div class="order-id">Order <strong>#${order._id.slice(-8).toUpperCase()}</strong></div>
            <div class="order-date">${formatDate(order.createdAt)}</div>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <span class="${getStatusBadgeClass(order.status)} badge">${STATUS_ICONS[order.status] || ''} ${order.status}</span>
            <span class="badge" style="background:rgba(63,185,80,0.1);color:#4cdb6a;border:1px solid rgba(63,185,80,0.3)">✓ Paid</span>
          </div>
        </div>
        <div class="order-card-body">
          ${!isCancelled ? renderTracker(order.status) : ''}
          <div class="order-items-preview">
            ${order.items.map(item => `
              <div class="order-item-chip">${item.image || '🍽️'} ${item.name} × ${item.quantity}</div>
            `).join('')}
          </div>
          ${order.deliveryAddress ? `<div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.25rem">📍 ${order.deliveryAddress}</div>` : ''}
        </div>
        <div class="order-card-footer">
          <div style="font-size:0.85rem;color:var(--text-muted)">${order.items.length} item${order.items.length > 1 ? 's' : ''}</div>
          <div class="order-total">₹${order.totalAmount}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTracker(status) {
  const steps = STATUS_STEPS;
  const currentIdx = steps.indexOf(status);

  return `
    <div class="order-tracker">
      ${steps.map((step, i) => {
        let cls = '';
        if (i < currentIdx) cls = 'done';
        else if (i === currentIdx) cls = 'active';
        const icons = { 'Pending': '📋', 'Preparing': '🍳', 'Out for Delivery': '🛵', 'Completed': '🎉' };
        return `
          <div class="track-step ${cls}">
            <div class="track-dot">${i <= currentIdx ? (icons[step] || '●') : ''}</div>
            <div class="track-label">${step}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getStatusBadgeClass(status) {
  const map = {
    'Pending': 'badge-pending',
    'Preparing': 'badge-preparing',
    'Out for Delivery': 'badge-delivery',
    'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled'
  };
  return map[status] || 'badge-pending';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
