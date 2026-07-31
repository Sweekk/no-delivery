import React from 'react';
import Header from '../components/common/Header';

export default function RootLayout({ children, onViewChange }) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col selection:bg-amber-100">
      <Header onViewChange={onViewChange} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
