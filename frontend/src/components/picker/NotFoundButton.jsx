import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function NotFoundButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
    >
      <AlertCircle className="w-3.5 h-3.5" />
      <span>Item Not Found</span>
    </button>
  );
}
