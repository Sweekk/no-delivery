import React, { useState } from 'react';
import { PRODUCTS } from '../../data/products.js';

export const UnavailableActionModal = ({
  item,
  onConfirm,
  onClose,
}) => {
  const alternatives = PRODUCTS.filter(
    p => p.category === item.product.category && p.id !== item.product.id
  );

  const [selectedAlt] = useState(alternatives[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 text-slate-900">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-left">
        <h3 className="text-base font-extrabold text-slate-900">Flag Out of Stock</h3>
        <p className="text-xs text-slate-500">{item.product.name} is marked unavailable.</p>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedAlt)}
            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
