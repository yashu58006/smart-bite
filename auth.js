/* ==========================================
   AUTH PAGE LOGIC
   ========================================== */

// Redirect if already logged in
if (api.isLoggedIn()) {
  const user = api.getUser();
  if (user && user.isAdmin) {
    window.location.href = 'pages/admin.html';
  } else {
    window.location.href = 'pages/dashboard.html';
  }
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(tab + 'Form').classList.add('active');
  document.querySelector(`.tab-btn:${tab === 'login' ? 'first-child' : 'last-child'}`).classList.add('active');
  clearMessages();
}

function clearMessages() {
  ['loginError','loginSuccess','signupError','signupSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.textContent = ''; }
  });
}

function showMessage(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert alert-${type}`;
}

function togglePassword(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

async function handleLogin() {
  clearMessages();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    return showMessage('loginError', '⚠️ Please fill in all fields');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return showMessage('loginError', '⚠️ Please enter a valid email');
  }

  setLoading('loginBtn', true);
  try {
    const data = await api.post('/auth/login', { email, password });
    api.setAuth(data.token, data.user);
    showMessage('loginSuccess', '✅ Welcome back! Redirecting...', 'success');

    setTimeout(() => {
      if (data.user.isAdmin) {
        window.location.href = 'pages/admin.html';
      } else {
        window.location.href = 'pages/dashboard.html';
      }
    }, 800);
  } catch (err) {
    showMessage('loginError', '❌ ' + err.message);
    setLoading('loginBtn', false);
  }
}

async function handleSignup() {
  clearMessages();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !password) {
    return showMessage('signupError', '⚠️ Please fill in all fields');
  }
  if (name.length < 2) {
    return showMessage('signupError', '⚠️ Name must be at least 2 characters');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return showMessage('signupError', '⚠️ Please enter a valid email');
  }
  if (password.length < 6) {
    return showMessage('signupError', '⚠️ Password must be at least 6 characters');
  }

  setLoading('signupBtn', true);
  try {
    const data = await api.post('/auth/register', { name, email, password });
    api.setAuth(data.token, data.user);
    showMessage('signupSuccess', '🎉 Account created! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = 'pages/dashboard.html';
    }, 800);
  } catch (err) {
    showMessage('signupError', '❌ ' + err.message);
    setLoading('signupBtn', false);
  }
}

// Allow Enter key
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const activeForm = document.querySelector('.auth-form.active');
    if (!activeForm) return;
    if (activeForm.id === 'loginForm') handleLogin();
    else handleSignup();
  }
});
