import React from 'react';
import { Check, X } from 'lucide-react';

export const PickItemRow = ({
  item,
  onMarkAvailable,
  onMarkUnavailable,
}) => {
  const isFinalized = item.pickingStatus === 'substituted' || item.pickingStatus === 'skipped';

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 text-xs">
      <div>
        <h5 className="font-extrabold text-slate-900">{item.product.name}</h5>
        <p className="text-[11px] text-slate-500">₹{item.product.price} x {item.quantity}</p>
      </div>

      <div className="flex items-center gap-2">
        {isFinalized ? (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300">
            {item.pickingStatus === 'substituted' ? '✓ Alternate Selected (Final)' : '✗ Item Skipped'}
          </span>
        ) : (
          <>
            <button
              onClick={onMarkAvailable}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 inline mr-1" /> Available
            </button>
            <button
              onClick={onMarkUnavailable}
              className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5 inline mr-1" /> Not Available
            </button>
          </>
        )}
      </div>
    </div>
  );
};
