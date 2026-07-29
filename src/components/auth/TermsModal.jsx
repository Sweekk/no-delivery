import React from 'react';
import { X, ShieldCheck, Check } from 'lucide-react';

export const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Terms & Substitution Policy</h3>
              <p className="text-xs text-slate-500 font-medium">Online Grocery Shopping App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 pr-2 leading-relaxed font-medium">
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h4 className="font-extrabold text-emerald-800 mb-1 text-sm">1. Grocery Store Stock Policy</h4>
            <p>
              Local grocery store inventory changes rapidly. If an ordered item is unavailable, customers are provided three options to resolve the unavailable item.
            </p>
          </section>

          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h4 className="font-extrabold text-emerald-800 mb-1 text-sm">2. Three Resolution Options for Missing Items</h4>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
              <li><strong className="text-slate-900">Option i — Choose a replacement myself:</strong> Select an alternate item from the grocery catalog.</li>
              <li><strong className="text-slate-900">Option ii — Let the picker choose:</strong> Allow the picker to substitute a relevant item from the same category.</li>
              <li><strong className="text-slate-900">Option iii — Skip the item:</strong> Remove the unavailable item from the order summary.</li>
            </ul>
          </section>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" /> I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
