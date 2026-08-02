import React from 'react';
import { Dashboard } from '../../components/admin/Dashboard.jsx';

export const AdminDashboard = ({ onLogout }) => {
  return <Dashboard onLogout={onLogout} />;
};
