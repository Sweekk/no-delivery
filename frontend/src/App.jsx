import React, { useState, useEffect } from 'react';
import { LogOut, UserCheck } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { OrderProvider } from './context/OrderContext.jsx';

// Workspaces & Pages
import { Home as CustomerHome } from './pages/customer/Home.jsx';
import CustomerCheckout from './pages/CustomerCheckout';
import PickerRun from './pages/PickerRun';
import AdminDashboard from './pages/AdminDashboard';
import { DeliveryPortal } from './pages/delivery/DeliveryPortal.jsx';
import LoginPage from './pages/auth/Login.jsx';
import { getToken, getStoredUser, clearSession } from './authApi';

const workspaces = {
  customer: { label: 'Customer Workspace', detail: 'Storefront catalog, basket & live order tracking', component: CustomerHome },
  picker: { label: 'Store Picker Workspace', detail: 'Dark store order picking, item replacement & fulfillment', component: PickerRun },
  delivery: { label: 'Delivery Partner Workspace', detail: 'Live route assignments, order pickup & delivery confirmation', component: DeliveryPortal },
  admin: { label: 'Admin Workspace', detail: 'Network metrics, store analytics & operational oversight', component: AdminDashboard },
};

function MainAppContent() {
  const {
    currentUser,
    logout,
    toastMessage,
    showToast,
  } = useAuth();

  const [activeRole, setActiveRole] = useState(null);
  const [sessionUser, setSessionUser] = useState(() => (getToken() ? getStoredUser() : null));

  // Sync active session user and role
  useEffect(() => {
    const user = currentUser || sessionUser || getStoredUser();
    if (user) {
      setSessionUser(user);
      if (user.role) {
        setActiveRole(user.role);
      }
    }
  }, [currentUser, sessionUser]);

  const handleAuthenticated = (user) => {
    setSessionUser(user);
    if (user && user.role) {
      setActiveRole(user.role);
    } else {
      setActiveRole('customer');
    }
  };

  const handleLogout = () => {
    clearSession();
    logout();
    setSessionUser(null);
    setActiveRole(null);
  };

  // Unauthenticated user -> render original restored LoginPage
  if (!sessionUser && !getToken()) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  const currentRole = activeRole || sessionUser?.role || 'customer';
  const activeWorkspace = workspaces[currentRole] || workspaces.customer;
  const Component = activeWorkspace.component;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Global Authenticated Workspace Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-extrabold text-emerald-900 text-lg">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">Q</span>
              <span>QuickFix Grocery</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>{activeWorkspace.label}</span>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentRole}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 hidden md:block">{activeWorkspace.detail}</div>
            </div>
          </div>


          {/* User Session Meta & Logout Button */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                {sessionUser?.username || sessionUser?.name || 'Authenticated User'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">JWT Active</div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Active Component View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <Component onLogout={handleLogout} showToast={showToast} currentUser={sessionUser} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <MainAppContent />
      </OrderProvider>
    </AuthProvider>
  );
}
