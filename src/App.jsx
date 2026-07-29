import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  ShoppingBasket,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';

import { ROLES } from './data/roles.js';
import { Logo } from './components/common/Logo.jsx';
import { Toast } from './components/common/Toast.jsx';
import { RoleSelector } from './components/auth/RoleSelector.jsx';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal.jsx';
import { CreateAccountModal } from './components/auth/CreateAccountModal.jsx';
import { TermsModal } from './components/auth/TermsModal.jsx';

// Multi-Role Pages
import { OrderProvider } from './context/OrderContext.jsx';
import { Home as CustomerHome } from './pages/customer/Home.jsx';
import { PickerQueue } from './pages/picker/PickerQueue.jsx';
import { AdminDashboard } from './pages/admin/Dashboard.jsx';

function MainAppContent() {
  const [selectedRole, setSelectedRole] = useState('customer');
  const [emailOrUsername, setEmailOrUsername] = useState('alex.customer@quickfix.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    const config = ROLES.find((r) => r.id === role);
    if (config) {
      setEmailOrUsername(config.demoEmail);
      setPassword(config.demoPassword);
      showToast(`Switched role to ${config.label}. Demo credentials auto-filled.`, 'success');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const currentRoleObj = ROLES.find((r) => r.id === selectedRole);
      const roleLabel = currentRoleObj ? currentRoleObj.label : selectedRole;
      
      const derivedName = emailOrUsername.includes('@')
        ? emailOrUsername.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase())
        : emailOrUsername;

      setLoggedInUser({
        name: derivedName,
        email: emailOrUsername,
        role: selectedRole,
      });

      showToast(`Logged in successfully as ${roleLabel}!`, 'success');
    }, 600);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    showToast('Signed out successfully.', 'success');
  };

  const activeRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  // LOGGED IN VIEW
  if (loggedInUser) {
    if (loggedInUser.role === 'customer') {
      return (
        <CustomerHome
          userName={loggedInUser.name}
          userEmail={loggedInUser.email}
          userRole={activeRoleConfig.label}
          onLogout={handleLogout}
        />
      );
    }

    if (loggedInUser.role === 'picker') {
      return <PickerQueue onLogout={handleLogout} />;
    }

    if (loggedInUser.role === 'admin') {
      return <AdminDashboard onLogout={handleLogout} />;
    }
  }

  // LOGIN PAGE (WHITE BACKGROUND BASE THEME & GROCERY BRANDING)
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-white text-slate-900 font-sans">
      <Toast message={toast?.message || null} type={toast?.type} />

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onSuccess={(role, email) => {
          setSelectedRole(role);
          const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
          setLoggedInUser({ name, email, role });
          showToast(`Account created! Welcome to FreshBasket Grocery.`, 'success');
        }}
      />
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo showTagline={false} />

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShoppingBasket className="w-3.5 h-3.5 text-emerald-600" />
              <span>Online Grocery Shopping App</span>
            </span>

            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Grocery Substitution Policy
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 bg-white">
        <div className="w-full max-w-xl mx-auto space-y-6">
          
          {/* Grocery Branding Banner */}
          <div className="bg-emerald-50/80 rounded-3xl p-6 border border-emerald-100 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
              <ShoppingBasket className="w-8 h-8" />
            </div>
            <div className="space-y-1 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                FreshBasket Grocery Shopping App
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
                Customer Frontend Portal & Item Substitution Management System
              </p>
            </div>
          </div>

          {/* Login Form Container */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
            
            {/* Role Selection Tabs (3 Roles: Customer, Picker, Admin) */}
            <div className="space-y-2.5">
              <RoleSelector
                selectedRole={selectedRole}
                onSelectRole={handleRoleChange}
                disabled={isLoading}
              />

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700 font-medium">
                <span>Selected Login Role:</span>
                <span className="font-bold text-emerald-800">{activeRoleConfig.badge}</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              {/* Email / Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Email or Username <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. alex.customer@quickfix.com"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password <span className="text-emerald-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setShowPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Auto-fill button */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500 font-medium">Academic Project Demo Mode</span>

                <button
                  type="button"
                  onClick={() => handleRoleChange(selectedRole)}
                  className="font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Auto-fill Demo Credentials
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <span>Log In as {activeRoleConfig.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Create Account Link */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Need a new customer account?</span>
              <button
                type="button"
                onClick={() => setIsCreateAccountOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-emerald-800 font-bold transition cursor-pointer"
              >
                Create Account
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
        <div className="font-medium">
          © 2026 FreshBasket Grocery Shopping App. Student Academic Project.
        </div>
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-emerald-700 transition cursor-pointer">
            Substitution Rules
          </button>
          <span>•</span>
          <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-emerald-700 transition cursor-pointer">
            Terms
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <OrderProvider>
      <MainAppContent />
    </OrderProvider>
  );
}
