import React from 'react';
import Navbar from '../components/common/Navbar';
import Dashboard from '../components/admin/Dashboard';

export default function AdminDashboard({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar currentRoute="admin" onNavigate={onNavigate} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-black text-gray-900">QuickFix Grocery Admin Dashboard</h1>
          <p className="text-xs text-gray-500">Monitor store fulfillment, substitution rates, and flagged stores</p>
        </div>
        <Dashboard />
      </main>
    </div>
  );
}
