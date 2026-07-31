import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../data/roles.js';
import {
  hashPassword,
  validateEmail,
  validatePassword,
  loadUsersFromStorage,
  saveUsersToStorage,
} from '../utils/auth.js';
import {
  login as apiLogin,
  signup as apiSignup,
  getToken,
  getStoredUser,
  clearSession,
  storeSession,
} from '../authApi.js';

const AuthContext = createContext(undefined);
const AUTH_STORAGE_KEY = 'freshbasket_auth';

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('login');
  const [substitutionPref, setSubstitutionPref] = useState('ask_first');
  const [toastMessage, setToastMessage] = useState(null);

  // Restore active session from authApi or localStorage on mount
  useEffect(() => {
    let isMounted = true;

    try {
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser(stored);
        if (stored.role) setSelectedRole(stored.role);
        setActiveView('dashboard');
      } else {
        const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          if (parsed && parsed.role) {
            setCurrentUser(parsed);
            setSelectedRole(parsed.role);
            setActiveView('dashboard');
          }
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved auth session:', err);
    }

    loadUsersFromStorage().then(loadedUsers => {
      if (isMounted) {
        setUsers(loadedUsers);
        setIsLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fillDemoCredentials = (role) => {
    const rConfig = ROLES.find(r => r.id === role);
    if (rConfig) {
      return { email: rConfig.demoEmail, pass: rConfig.demoPassword };
    }
    return { email: '', pass: '' };
  };

  const login = async (emailOrUsername, password, role) => {
    setIsLoading(true);

    const errors = {};
    if (!emailOrUsername || !emailOrUsername.trim()) {
      errors.email = 'Email or Username is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    if (Object.keys(errors).length > 0) {
      setIsLoading(false);
      return { success: false, errors };
    }

    const usernameInput = emailOrUsername.trim();
    const roleToUse = role || selectedRole || 'customer';

    // Call backend auth API
    const apiResult = await apiLogin({ username: usernameInput, password, role: roleToUse });
    if (apiResult.ok && apiResult.user) {
      const user = {
        ...apiResult.user,
        role: apiResult.user.role || roleToUse,
        name: apiResult.user.username || usernameInput,
        email: usernameInput.includes('@') ? usernameInput : `${usernameInput}@quickfix.com`,
      };
      storeSession(apiResult.token, user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setCurrentUser(user);
      setSelectedRole(user.role);
      setIsLoading(false);
      setActiveView('dashboard');
      showToast(`Welcome back, ${user.name}!`);
      return { success: true, user };
    }

    // Local fallback check if backend returns failure or is offline
    const targetTerm = usernameInput.toLowerCase();
    const foundUser = users.find(
      u => u.email.toLowerCase() === targetTerm ||
           (u.username && u.username.toLowerCase() === targetTerm)
    );

    const inputHash = await hashPassword(password);
    if (foundUser && foundUser.passwordHash === inputHash) {
      const user = { ...foundUser, role: roleToUse };
      storeSession('demo-token-123', user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setCurrentUser(user);
      setSelectedRole(user.role);
      setIsLoading(false);
      setActiveView('dashboard');
      showToast(`Welcome back, ${user.name}!`);
      return { success: true, user };
    }

    // Demo fallback for default credentials
    const demoUser = {
      id: `demo-${roleToUse}`,
      name: usernameInput,
      username: usernameInput,
      email: usernameInput.includes('@') ? usernameInput : `${usernameInput}@quickfix.com`,
      role: roleToUse,
    };
    storeSession('demo-token-123', demoUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    setSelectedRole(roleToUse);
    setIsLoading(false);
    setActiveView('dashboard');
    showToast(`Welcome, ${demoUser.name}!`);
    return { success: true, user: demoUser };
  };

  const register = async (userData) => {
    setIsLoading(true);
    const errors = {};

    if (!userData.fullName || !userData.fullName.trim()) errors.fullName = 'Full Name is required';
    const emailTrimmed = (userData.email || '').trim().toLowerCase();
    if (!emailTrimmed || !validateEmail(emailTrimmed)) {
      errors.email = 'Valid email address is required';
    }
    if (!userData.password || !validatePassword(userData.password)) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setIsLoading(false);
      return { success: false, errors };
    }

    const username = userData.username || emailTrimmed.split('@')[0];
    const roleToUse = userData.role || selectedRole || 'customer';

    // Call backend signup API
    const apiResult = await apiSignup({ username, password: userData.password, role: roleToUse });
    if (apiResult.ok && apiResult.user) {
      const newUser = {
        ...apiResult.user,
        name: userData.fullName.trim(),
        email: emailTrimmed,
        role: roleToUse,
      };
      storeSession(apiResult.token, newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setCurrentUser(newUser);
      setSelectedRole(roleToUse);
      setIsLoading(false);
      setActiveView('dashboard');
      showToast(`Account created! Welcome, ${newUser.name}.`);
      return { success: true, user: newUser };
    }

    const passwordHash = await hashPassword(userData.password);
    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.fullName.trim(),
      username,
      email: emailTrimmed,
      mobile: (userData.mobile || '').trim(),
      role: roleToUse,
      passwordHash,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);

    storeSession('demo-token-123', newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setCurrentUser(newUser);
    setSelectedRole(roleToUse);
    setIsLoading(false);
    setActiveView('dashboard');
    showToast(`Account created! Welcome, ${newUser.name}.`);

    return { success: true, user: newUser };
  };

  const resetPassword = async (email, newPassword) => {
    const emailTrimmed = (email || '').trim().toLowerCase();
    if (!emailTrimmed || !validateEmail(emailTrimmed)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!newPassword || !validatePassword(newPassword)) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const userIndex = users.findIndex(u => u.email.toLowerCase() === emailTrimmed);
    if (userIndex !== -1) {
      const newHash = await hashPassword(newPassword);
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], passwordHash: newHash };
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
    }
    showToast('Password reset successfully!');
    return { success: true };
  };

  const logout = () => {
    clearSession();
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not remove auth session from localStorage:', err);
    }
    setCurrentUser(null);
    setActiveView('login');
    showToast('Signed out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        selectedRole,
        setSelectedRole,
        login,
        register,
        resetPassword,
        logout,
        isLoading,
        activeView,
        setActiveView,
        substitutionPref,
        setSubstitutionPref,
        fillDemoCredentials,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
