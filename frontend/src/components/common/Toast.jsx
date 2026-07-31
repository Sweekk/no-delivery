import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const Toast = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl ${
        type === 'success' 
          ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 shadow-slate-950/50' 
          : 'bg-rose-950/95 border-rose-500/50 text-rose-200 shadow-rose-950/50'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        )}
        <span className="text-xs font-bold tracking-wide">{message}</span>
      </div>
    </div>
  );
};
