import React from 'react';
import { Truck, ArrowLeft } from 'lucide-react';

export const DeliveryPortal = ({ onLogout }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans p-6 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
          <Truck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Delivery Partner Portal
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 pt-2">Delivery Portal — Coming Soon</h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
            This module is explicitly out of scope for the Customer Frontend focus submission. Order dispatch routes and driver delivery assignments will be managed by teammates.
          </p>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login / Role Selection
          </button>
        )}
      </div>
    </div>
  );
};
