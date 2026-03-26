/* ==========================================
   API HELPER — Centralized fetch wrapper
   ========================================== */

const API_BASE = window.location.origin + '/api';

// Determine correct prefix based on current page depth
function getPrefix() {
  const path = window.location.pathname;
  if (path.includes('/pages/')) return '../';
  return '';
}

const api = {
  getToken() {
    return localStorage.getItem('sf_token');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('sf_user')) || null;
    } catch { return null; }
  },

  setAuth(token, user) {
    localStorage.setItem('sf_token', token);
    localStorage.setItem('sf_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  async request(method, endpoint, body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      return data;
    } catch (err) {
      throw err;
    }
  },

  get(endpoint, auth = false) { return this.request('GET', endpoint, null, auth); },
  post(endpoint, body, auth = false) { return this.request('POST', endpoint, body, auth); },
  put(endpoint, body, auth = false) { return this.request('PUT', endpoint, body, auth); },
  delete(endpoint, auth = false) { return this.request('DELETE', endpoint, null, auth); },
};

// Redirect if not logged in (for protected pages)
function requireAuth() {
  if (!api.isLoggedIn()) {
    const prefix = getPrefix();
    window.location.href = prefix + 'index.html';
    return false;
  }
  return true;
}

function logout() {
  api.clearAuth();
  const prefix = getPrefix();
  window.location.href = prefix + 'index.html';
}

function toggleMobileNav() {
  const links = document.querySelector('.nav-links');
  if (links) links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// Set user name in nav
function setUserName() {
  const user = api.getUser();
  const el = document.getElementById('userName');
  const hero = document.getElementById('heroName');
  if (el && user) el.textContent = user.name;
  if (hero && user) hero.textContent = user.name.split(' ')[0] + '?';
}
