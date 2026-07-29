// src/App.jsx
import React, { useState, useEffect } from 'react';
import CustomerCheckout from './pages/CustomerCheckout';
import PickerRun from './pages/PickerRun';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [page, setPage] = useState('checkout');

  // Update page based on URL hash
  useEffect(() => {
    const updatePage = () => {
      const hash = window.location.hash.replace('#', '') || 'checkout';
      setPage(hash);
    };
    // Listen for hash changes
    window.addEventListener('hashchange', updatePage);
    // Set initial page
    updatePage();
    return () => window.removeEventListener('hashchange', updatePage);
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'picker':
        return <PickerRun />;
      case 'admin':
        return <AdminDashboard />;
      case 'checkout':
      default:
        return <CustomerCheckout />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white border-b flex gap-4 font-semibold">
        <a href="#checkout" className="hover:underline">Customer Checkout</a>
        <a href="#picker" className="hover:underline">Picker Run</a>
        <a href="#admin" className="hover:underline">Admin Dashboard</a>
      </nav>
      <main className="p-6">
        {renderPage()}
      </main>
    </div>
  );
}
