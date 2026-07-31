import React from 'react';
import { Truck, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onViewChange, currentView }) {
  const { partner, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        
        {/* Brand & Partner Status */}
        <div className="flex items-center gap-4 shrink-0 cursor-pointer" onClick={() => onViewChange('dashboard')}>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-gray-900 block">Blinkit Fleet</span>
            <span className="text-xs font-semibold text-emerald-600">
              {partner ? `Online (${partner.name})` : 'Partner Portal'}
            </span>
          </div>
        </div>

        {/* Dynamic Search Bar for Orders */}
        <div className="flex-1 max-w-xl relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search Order ID (e.g. ORD-9821) or customer name..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Navigation & Auth Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {partner ? (
            <>
              <button 
                onClick={() => onViewChange('orders')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 ${
                  currentView === 'orders' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Tasks</span>
              </button>
              <button 
                onClick={logout}
                className="p-2.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => onViewChange('login')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Partner Login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
