import React from 'react';

export default function Navbar({ currentRoute, onNavigate, partnerName = "Partner #402", partnerZone = "Central Metro", onSearch, searchQuery = "", onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Partner Status */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer" 
            onClick={() => onNavigate && onNavigate('delivery-dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              Q
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-gray-900 block leading-tight">
                QuickFix <span className="text-emerald-600">Grocery</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 block">
                Online &bull; {partnerName} ({partnerZone})
              </span>
            </div>
          </div>

          {/* Search Bar for Delivery Partner */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch && onSearch(e.target.value)}
                placeholder="Search assigned orders or addresses..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-600"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Dedicated Delivery Partner Navigation */}
          <nav className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <button
              onClick={() => onNavigate && onNavigate('delivery-dashboard')}
              className={`px-3 py-2 rounded-xl transition-colors ${currentRoute === 'delivery-dashboard' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate && onNavigate('delivery-orders')}
              className={`px-3 py-2 rounded-xl transition-colors ${currentRoute === 'delivery-orders' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Orders
            </button>
            <button
              onClick={() => onNavigate && onNavigate('delivery-profile')}
              className={`px-3 py-2 rounded-xl transition-colors ${currentRoute === 'delivery-profile' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Profile
            </button>

            {/* Logout Action */}
            <button
              onClick={onLogout}
              title="Log Out"
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </nav>

        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            placeholder="Search assigned orders or addresses..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

      </div>
    </header>
  );
}
