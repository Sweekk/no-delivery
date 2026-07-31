import { ROLES } from '../data/roles.js';

// Convert ArrayBuffer to Hex String
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Async SHA-256 Password Hashing using Web Crypto API
export const hashPassword = async (password) => {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
};

// Email validation regex
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim().toLowerCase());
};

// Password validation (min 6 characters)
export const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

// Pre-seeded Demo Users Key for localStorage
const LOCAL_STORAGE_USERS_KEY = 'freshbasket_users_v2';

export const getPreseededUsers = async () => {
  const customerHash = await hashPassword('Password123!');
  const pickerHash = await hashPassword('Password123!');
  const adminHash = await hashPassword('AdminPassword123!');

  return ROLES.map((r, index) => {
    let passwordHash = customerHash;
    if (r.id === 'picker') passwordHash = pickerHash;
    if (r.id === 'admin') passwordHash = adminHash;

    return {
      id: `usr-${index + 1}`,
      name: `${r.label} Demo User`,
      username: r.label.toLowerCase().replace(/\s+/g, '_'),
      email: r.demoEmail.toLowerCase(),
      mobile: '+91 98765-43210',
      role: r.id,
      passwordHash,
      storeName: r.id === 'picker' ? 'FreshMart Green Park Branch #402' : undefined,
    };
  });
};

export const loadUsersFromStorage = async () => {
  const preseeded = await getPreseededUsers();
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all preseeded roles exist in stored users
        const merged = [...parsed];
        preseeded.forEach(p => {
          if (!merged.some(u => u.email.toLowerCase() === p.email.toLowerCase())) {
            merged.push(p);
          }
        });
        saveUsersToStorage(merged);
        return merged;
      }
    }
  } catch (err) {
    console.error('Failed to load users from localStorage:', err);
  }

  saveUsersToStorage(preseeded);
  return preseeded;
};


export const saveUsersToStorage = (users) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage:', err);
  }
};
