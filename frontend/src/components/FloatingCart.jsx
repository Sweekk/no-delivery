import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export const FloatingCart = ({ cartItems, onOpenCart }) => {
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-slide-up">
      <button
        onClick={onOpenCart}
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl hover:shadow-emerald-600/30 transition-all duration-300 cursor-pointer border border-emerald-500 scale-[1.02] hover:scale-105 active:scale-95"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
            {totalCount}
          </span>
        </div>

        <span>Cart ({totalCount})</span>
        <span className="bg-emerald-700 px-2 py-0.5 rounded-lg font-mono font-bold text-xs">
          ₹{totalPrice}
        </span>
        <ArrowRight className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
};
