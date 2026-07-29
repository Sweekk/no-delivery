import React, { createContext, useContext, useState } from 'react';
import { ROLES } from '../data/roles.js';

const INITIAL_USERS = ROLES.map((r, index) => ({
  id: `usr-${index + 1}`,
  name: `${r.label} Demo User`,
  username: r.label.toLowerCase().replace(/\s+/g, '_'),
  email: r.demoEmail,
  mobile: '+1 800-555-0199',
  role: r.id,
  storeName: r.id === 'picker' ? 'FreshMart Green Park Branch #402' : undefined,
}));

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('login');
  const [substitutionPref, setSubstitutionPref] = useState('ask_first');
  const [toastMessage, setToastMessage] = useState(null);

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
    await new Promise(res => setTimeout(res, 600));

    const errors = {};

    if (!emailOrUsername.trim()) {
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrUsername)) {
        setIsLoading(false);
        return { success: false, errors: { email: 'Please enter a valid email address' } };
      }
    }

    const foundUser = users.find(
      u => u.email.toLowerCase() === emailOrUsername.toLowerCase().trim() ||
           u.username.toLowerCase() === emailOrUsername.toLowerCase().trim()
    );

    if (!foundUser) {
      setIsLoading(false);
      return {
        success: false,
        errors: { general: 'No account found with this email or username.' }
      };
    }

    if (foundUser.role !== role) {
      setIsLoading(false);
      const assignedRoleConfig = ROLES.find(r => r.id === foundUser.role);
      return {
        success: false,
        errors: {
          role: `Access Denied: Account registered as [${assignedRoleConfig?.label}].`
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
    await new Promise(res => setTimeout(res, 600));

    const errors = {};

    if (!userData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!userData.username.trim()) errors.username = 'Username is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email.trim() || !emailRegex.test(userData.email)) {
      errors.email = 'Valid email is required';
    }

    if (!userData.mobile.trim() || userData.mobile.length < 8) {
      errors.mobile = 'Valid phone number is required';
    }

    if (!userData.password || userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setIsLoading(false);
      return { success: false, errors };
    }

    const existing = users.find(
      u => u.email.toLowerCase() === userData.email.toLowerCase() ||
           u.username.toLowerCase() === userData.username.toLowerCase()
    );

    if (existing) {
      setIsLoading(false);
      return {
        success: false,
        errors: { general: 'An account with this email or username already exists.' }
      };
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.fullName,
      username: userData.username,
      email: userData.email,
      mobile: userData.mobile,
      role: userData.role,
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setSelectedRole(userData.role);
    setIsLoading(false);
    setActiveView('dashboard');
    showToast(`Account created successfully! Welcome, ${newUser.name}.`);

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
        currentUser,
        selectedRole,
        setSelectedRole,
        login,
        register,
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
