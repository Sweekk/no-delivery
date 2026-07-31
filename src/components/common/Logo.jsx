import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const Logo = ({ className = '', showTagline = true }) => {
  return (
    <div className={`flex flex-col text-left ${className}`}>
      <div className="flex items-center gap-2 select-none">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1 font-bold text-xl tracking-tight text-slate-900">
          <span>FreshBasket</span>
          <span className="text-emerald-600 font-extrabold">Grocery</span>
        </div>
      </div>
      {showTagline && (
        <p className="text-[11px] text-slate-500 font-medium tracking-wide">
          Online Grocery Shopping
        </p>
      )}
    </div>
  );
};
