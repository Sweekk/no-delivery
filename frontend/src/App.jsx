import React, { useState, useEffect } from 'react';
import CustomerCheckout from './pages/CustomerCheckout';
import PickerRun from './pages/PickerRun';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#picker');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#picker');
    };
    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) {
      window.location.hash = '#picker';
    }
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch (currentHash) {
      case '#checkout':
        return <CustomerCheckout />;
      case '#admin':
        return <AdminDashboard />;
      case '#picker':
      default:
        return <PickerRun />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 font-sans">
              ND
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-sans">
              No-Delivery Picker & Admin
            </span>
          </div>
          
          <nav className="flex gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <a 
              href="#checkout" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentHash === '#checkout' 
                  ? 'bg-slate-800 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              Customer Checkout
            </a>
            <a 
              href="#picker" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentHash === '#picker' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              Picker Run
            </a>
            <a 
              href="#admin" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentHash === '#admin' 
                  ? 'bg-slate-800 text-white shadow' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              Admin Dashboard
            </a>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}
