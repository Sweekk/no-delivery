import React, { useState, useEffect } from 'react';
import CustomerCheckout from './pages/CustomerCheckout';
import PickerRun from './pages/PickerRun';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryPartnerLogin from './pages/DeliveryPartnerLogin';
import DeliveryPartnerDashboard from './pages/DeliveryPartnerDashboard';
import DeliveryPartnerOrders from './pages/DeliveryPartnerOrders';
import DeliveryPartnerProfile from './pages/DeliveryPartnerProfile';
import ReportIssue from './pages/ReportIssue';

// ProtectedRoute Wrapper Component
function ProtectedRoute({ partner, onLoginSuccess, children }) {
  if (!partner) {
    return <DeliveryPartnerLogin onLoginSuccess={onLoginSuccess} />;
  }
  return children;
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('delivery-dashboard');
  const [partner, setPartner] = useState(null);

  // Sync hash routing with window location
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentRoute(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    window.location.hash = route;
  };

  const handleLoginSuccess = (partnerData) => {
    setPartner(partnerData || { email: 'partner@quickfixgrocery.com', name: 'Partner #402', zone: 'Central Metro Zone' });
    navigateTo('delivery-dashboard');
  };

  const handleLogout = () => {
    setPartner(null);
    navigateTo('delivery-login');
  };

  // Render view based on route
  const renderCurrentView = () => {
    switch (currentRoute) {
      // Non-Delivery Demo Modules (Unchanged)
      case 'checkout':
        return <CustomerCheckout onNavigate={navigateTo} />;

      case 'picker':
        return <PickerRun onNavigate={navigateTo} />;

      case 'admin':
        return <AdminDashboard onNavigate={navigateTo} />;

      // Delivery Partner Authentication
      case 'delivery-login':
        return <DeliveryPartnerLogin onLoginSuccess={handleLoginSuccess} onNavigate={navigateTo} />;

      // Protected Delivery Partner Routes
      case 'delivery-orders':
        return (
          <ProtectedRoute partner={partner} onLoginSuccess={handleLoginSuccess}>
            <DeliveryPartnerOrders onNavigate={navigateTo} onLogout={handleLogout} />
          </ProtectedRoute>
        );

      case 'delivery-profile':
        return (
          <ProtectedRoute partner={partner} onLoginSuccess={handleLoginSuccess}>
            <DeliveryPartnerProfile onNavigate={navigateTo} onLogout={handleLogout} />
          </ProtectedRoute>
        );

      case 'report-issue':
        return (
          <ProtectedRoute partner={partner} onLoginSuccess={handleLoginSuccess}>
            <ReportIssue onNavigate={navigateTo} onLogout={handleLogout} />
          </ProtectedRoute>
        );

      case 'delivery-dashboard':
      default:
        return (
          <ProtectedRoute partner={partner} onLoginSuccess={handleLoginSuccess}>
            <DeliveryPartnerDashboard onNavigate={navigateTo} onLogout={handleLogout} />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      {/* Dev-only module switcher bar — shown ONLY when viewing Customer/Picker/Admin demo routes */}
      {(currentRoute === 'checkout' || currentRoute === 'picker' || currentRoute === 'admin') && (
        <div className="bg-gray-900 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-black tracking-wide">QuickFix Grocery Platform</span>
            <span className="text-gray-400">| Demo Modules Router</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
            <button
              onClick={() => navigateTo('delivery-dashboard')}
              className="px-2.5 py-1 rounded bg-emerald-600 font-bold text-white"
            >
              Delivery Partner Portal
            </button>
            <button
              onClick={() => navigateTo('checkout')}
              className={`px-2.5 py-1 rounded transition-colors ${currentRoute === 'checkout' ? 'bg-emerald-600 font-bold text-white' : 'text-gray-300 hover:text-white'}`}
            >
              Customer Checkout
            </button>
            <button
              onClick={() => navigateTo('picker')}
              className={`px-2.5 py-1 rounded transition-colors ${currentRoute === 'picker' ? 'bg-emerald-600 font-bold text-white' : 'text-gray-300 hover:text-white'}`}
            >
              Picker Interface
            </button>
            <button
              onClick={() => navigateTo('admin')}
              className={`px-2.5 py-1 rounded transition-colors ${currentRoute === 'admin' ? 'bg-emerald-600 font-bold text-white' : 'text-gray-300 hover:text-white'}`}
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main App Container */}
      {renderCurrentView()}
    </div>
  );
}
