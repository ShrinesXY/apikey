const API_BASE = window.location.origin + '/api';

const api = {
  getToken: () => localStorage.getItem('azpkey_token'),

  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const token = this.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  async request(method, path, body = null) {
    const opts = { method, headers: this.headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, message: data.message || data.error || 'Request failed', data };
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),

  // Auth
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),

  // Keys
  getKeys: () => api.get('/keys'),
  createKey: (data) => api.post('/keys', data),
  updateKey: (id, data) => api.put(`/keys/${id}`, data),
  revokeKey: (id) => api.put(`/keys/${id}/revoke`),
  regenerateKey: (id) => api.put(`/keys/${id}/regenerate`),
  deleteKey: (id) => api.delete(`/keys/${id}`),
  getStats: () => api.get('/keys/stats'),
  getLogs: (page = 1) => api.get(`/keys/logs?page=${page}&limit=25`),

  // Admin
  adminStats: () => api.get('/admin/stats'),
  adminUsers: (page = 1) => api.get(`/admin/users?page=${page}`),
  adminKeys: (page = 1) => api.get(`/admin/keys?page=${page}`),
  banUser: (id, ban, reason) => api.put(`/admin/users/${id}/ban`, { ban, reason }),
  setTier: (id, tier) => api.put(`/admin/users/${id}/tier`, { tier }),
  updateKeyAdmin: (id, data) => api.put(`/admin/keys/${id}`, data),
};

// Auth guard
function requireAuth() {
  if (!api.getToken()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

function requireAdmin(user) {
  if (!user || user.role !== 'admin') {
    window.location.href = '/pages/dashboard.html';
    return false;
  }
  return true;
}

// Notification
function notify(msg, type = 'success') {
  let n = document.getElementById('globalNotif');
  if (!n) {
    n = document.createElement('div');
    n.id = 'globalNotif';
    n.className = 'notification';
    n.innerHTML = `<svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="notifIcon"></svg><span id="notifMsg"></span>`;
    document.body.appendChild(n);
  }
  const icon = n.querySelector('#notifIcon');
  const msgEl = n.querySelector('#notifMsg');
  msgEl.textContent = msg;
  n.className = 'notification ' + type;
  if (type === 'success') icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
  else icon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
  n.classList.add('show');
  clearTimeout(n._t);
  n._t = setTimeout(() => n.classList.remove('show'), 3500);
}

// Format date
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysUntil(d) {
  const diff = new Date(d) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function maskKey(key) {
  if (!key) return '';
  return key.substring(0, 12) + '••••••••••••••••••••••••' + key.slice(-6);
}

function usageColor(pct) {
  if (pct >= 90) return 'critical';
  if (pct >= 70) return 'warning';
  return '';
}
