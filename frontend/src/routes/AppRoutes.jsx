import React from 'react';
import Dashboard from '../pages/delivery/Dashboard';
import Orders from '../pages/delivery/Orders';
import Login from '../pages/auth/Login';

export default function AppRoutes({ currentView }) {
  switch (currentView) {
    case 'login':
      return <Login />;
    case 'orders':
      return <Orders />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}
