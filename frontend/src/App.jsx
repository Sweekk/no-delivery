import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/common/Header';
import Dashboard from './pages/delivery/Dashboard';
import Orders from './pages/delivery/Orders';
import Login from './pages/auth/Login';

function MainApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { partner } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900">
      {/* Header renders once at the layout level — not duplicated in child pages */}
      <Header onViewChange={setCurrentView} currentView={currentView} />

      <main className="flex-1">
        {!partner ? (
          <Login />
        ) : (
          <>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'orders' && <Orders />}
            {currentView === 'login' && <Login />}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
