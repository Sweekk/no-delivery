const API_BASE = process.env.REACT_APP_API_URL || '/api';

const TOKEN_KEY = 'quickfix_token';
const USER_KEY = 'quickfix_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function signup({ username, password, role }) {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Signup failed.' };
    storeSession(data.token, data.user);
    return { ok: true, user: data.user };
  } catch (err) {
    console.error('Signup fetch error:', err);
    return { ok: false, error: 'Could not connect to authentication server. Please ensure backend is running.' };
  }
}

export async function login({ username, password }) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Login failed.' };
    storeSession(data.token, data.user);
    return { ok: true, user: data.user };
  } catch (err) {
    console.error('Login fetch error:', err);
    return { ok: false, error: 'Could not connect to authentication server. Please ensure backend is running.' };
  }
}

export async function authFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    clearSession();
  }
  return res;
}
