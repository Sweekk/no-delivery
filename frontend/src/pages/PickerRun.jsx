import React, { useState } from 'react';
import OrderQueue from '../components/picker/OrderQueue';
import ActivePickList from '../components/picker/ActivePickList';

export default function PickerRun() {
  // Default to null so Store Picker Order Queue opens on load
  const [activeOrderId, setActiveOrderId] = useState(null);

  return (
    <div className="picker-page-wrapper space-y-4">
      {/* Top Quick Toggle */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-extrabold text-slate-800">
            {activeOrderId ? 'Active Picking Run' : 'Store Picker Order Queue'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveOrderId(activeOrderId ? null : 'ORD-94021')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer border border-emerald-200"
          >
            {activeOrderId ? '📋 View Order Queue' : '⚡ View Active Pick Run'}
          </button>
        </div>
      </div>

      {activeOrderId ? (
        <ActivePickList
          orderId={activeOrderId}
          onBackToQueue={() => setActiveOrderId(null)}
        />
      ) : (
        <OrderQueue
          onSelectOrder={(orderId) => setActiveOrderId(orderId)}
        />
      )}
    </div>
  );
}

