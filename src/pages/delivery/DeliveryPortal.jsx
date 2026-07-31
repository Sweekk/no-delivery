import React, { useState, useEffect } from 'react';
import DeliveryPartnerDashboard from '../DeliveryPartnerDashboard.jsx';
import DeliveryPartnerOrders from '../DeliveryPartnerOrders.jsx';
import DeliveryPartnerProfile from '../DeliveryPartnerProfile.jsx';
import ReportIssue from '../ReportIssue.jsx';

export const DeliveryPortal = ({ onLogout, currentUser }) => {
  const [currentRoute, setCurrentRoute] = useState('delivery-dashboard');

  // Hash route listener for sub-navigation within delivery domain
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['delivery-dashboard', 'delivery-orders', 'delivery-profile', 'report-issue'].includes(hash)) {
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

  const renderView = () => {
    switch (currentRoute) {
      case 'delivery-orders':
        return <DeliveryPartnerOrders onNavigate={navigateTo} onLogout={onLogout} currentUser={currentUser} />;
      case 'delivery-profile':
        return <DeliveryPartnerProfile onNavigate={navigateTo} onLogout={onLogout} currentUser={currentUser} />;
      case 'report-issue':
        return <ReportIssue onNavigate={navigateTo} onLogout={onLogout} currentUser={currentUser} />;
      case 'delivery-dashboard':
      default:
        return <DeliveryPartnerDashboard onNavigate={navigateTo} onLogout={onLogout} currentUser={currentUser} />;
    }
  };

  return (
    <div className="delivery-domain-container min-h-screen bg-slate-50 text-slate-900 font-sans">
      {renderView()}
    </div>
  );
};
