import React from 'react';
import CustomerCheckout from './pages/CustomerCheckout';
import PickerRun from './pages/PickerRun';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white border-b flex gap-4 font-semibold">
        <a href="#checkout" className="hover:underline">Customer Checkout</a>
        <a href="#picker" className="hover:underline">Picker Run</a>
        <a href="#admin" className="hover:underline">Admin Dashboard</a>
      </nav>
      <main className="p-6">
        <CustomerCheckout />
      </main>
    </div>
  );
}
