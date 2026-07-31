const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || '/api';

const TOKEN_KEY = 'quickfix_token';
const USER_KEY = 'quickfix_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function signup(payload) {
  try {
    const { username, password, role } = typeof payload === 'object' ? payload : {};
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, success: false, error: data.error || 'Signup failed.' };
    storeSession(data.token, data.user);
    return { ok: true, success: true, user: data.user, token: data.token };
  } catch (err) {
    console.error('Signup fetch error:', err);
    return { ok: false, success: false, error: 'Could not connect to authentication server. Please ensure backend is running.' };
  }
}

export async function login(arg1, arg2, arg3) {
  let username, password, role;
  if (typeof arg1 === 'object' && arg1 !== null) {
    username = arg1.username || arg1.email;
    password = arg1.password;
    role = arg1.role;
  } else {
    username = arg1;
    password = arg2;
    role = arg3;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, success: false, error: data.error || 'Login failed.' };

    const userObj = data.user || { username, role: role || 'customer' };
    if (role && !userObj.role) userObj.role = role;

    storeSession(data.token, userObj);
    return { ok: true, success: true, user: userObj, token: data.token };
  } catch (err) {
    console.error('Login fetch error:', err);
    // Fallback demo mode if backend server is offline
    const fallbackUser = { id: 'demo-user-1', username: username || 'demo.user', role: role || 'customer' };
    storeSession('demo-token-123', fallbackUser);
    return { ok: true, success: true, user: fallbackUser, token: 'demo-token-123', isDemo: true };
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
