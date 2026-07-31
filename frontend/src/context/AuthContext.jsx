import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../data/roles.js';
import {
  hashPassword,
  validateEmail,
  validatePassword,
  loadUsersFromStorage,
  saveUsersToStorage,
} from '../utils/auth.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('login');
  const [substitutionPref, setSubstitutionPref] = useState('ask_first');
  const [toastMessage, setToastMessage] = useState(null);

  // Load stored users on mount
  useEffect(() => {
    let isMounted = true;
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

    if (emailOrUsername.includes('@')) {
      if (!validateEmail(emailOrUsername)) {
        setIsLoading(false);
        return { success: false, errors: { email: 'Please enter a valid email address' } };
      }
    }

    const targetTerm = emailOrUsername.toLowerCase().trim();
    const foundUser = users.find(
      u => u.email.toLowerCase() === targetTerm ||
           (u.username && u.username.toLowerCase() === targetTerm)
    );

    // Verify password hash securely
    const inputHash = await hashPassword(password);

    if (!foundUser || foundUser.passwordHash !== inputHash) {
      setIsLoading(false);
      return {
        success: false,
        errors: { general: 'Invalid email/username or password combination.' }
      };
    }

    if (foundUser.role !== role) {
      setIsLoading(false);
      const assignedRoleConfig = ROLES.find(r => r.id === foundUser.role);
      return {
        success: false,
        errors: {
          role: `Access Denied: Account registered as [${assignedRoleConfig?.label || foundUser.role}].`
        }
      };
    }

    setCurrentUser(foundUser);
    setIsLoading(false);
    setActiveView('dashboard');
    showToast(`Welcome back, ${foundUser.name}!`);

    return { success: true };
  };

  const register = async (userData) => {
    setIsLoading(true);

    const errors = {};

    if (!userData.fullName || !userData.fullName.trim()) errors.fullName = 'Full Name is required';
    
    const emailTrimmed = (userData.email || '').trim().toLowerCase();
    if (!emailTrimmed || !validateEmail(emailTrimmed)) {
      errors.email = 'Valid email address is required';
    }

    if (!userData.mobile || userData.mobile.trim().length < 8) {
      errors.mobile = 'Valid phone number is required';
    }

    if (!userData.password || !validatePassword(userData.password)) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setIsLoading(false);
      return { success: false, errors };
    }

    const usernameDerived = userData.username || emailTrimmed.split('@')[0];

    const existing = users.find(
      u => u.email.toLowerCase() === emailTrimmed ||
           (u.username && u.username.toLowerCase() === usernameDerived.toLowerCase())
    );

    if (existing) {
      setIsLoading(false);
      return {
        success: false,
        errors: { general: 'An account with this email address already exists.' }
      };
    }

    const passwordHash = await hashPassword(userData.password);

    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.fullName.trim(),
      username: usernameDerived,
      email: emailTrimmed,
      mobile: userData.mobile.trim(),
      role: userData.role || 'customer',
      passwordHash,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);

    setCurrentUser(newUser);
    setSelectedRole(newUser.role);
    setIsLoading(false);
    setActiveView('dashboard');
    showToast(`Account created successfully! Welcome, ${newUser.name}.`);

    return { success: true };
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
    if (userIndex === -1) {
      return { success: false, error: 'No account found with this email address.' };
    }

    const newHash = await hashPassword(newPassword);
    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      passwordHash: newHash,
    };

    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
    showToast('Password reset successfully! You can now log in with your new password.');

    return { success: true };
  };

  const logout = () => {
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
