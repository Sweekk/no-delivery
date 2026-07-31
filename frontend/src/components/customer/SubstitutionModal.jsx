import React from 'react';

export const SubstitutionModal = ({ item, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-slate-900">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-left">
        <h3 className="text-lg font-extrabold text-slate-900">Item Unavailable</h3>
        <p className="text-xs text-slate-600 font-medium">
          {item.product.name} is currently out of stock.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onReject}
            className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
          >
            Skip Item
          </button>
          <button
            onClick={onAccept}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
};
