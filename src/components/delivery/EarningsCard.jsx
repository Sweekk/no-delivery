import React from 'react';

export default function EarningsCard({ dailyEarnings = 1420, completedOrders = 12, rating = 4.9 }) {
  return (
    <div className="bg-emerald-700 text-white rounded-3xl p-6 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Today's Performance</span>
        <span className="bg-emerald-800 text-emerald-100 text-xs font-bold px-2.5 py-1 rounded-full">
          Active Shift
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-emerald-600/60 pt-4">
        <div>
          <span className="text-[11px] text-emerald-200 block">Total Earnings</span>
          <span className="text-xl font-black">₹{dailyEarnings}</span>
        </div>
        <div>
          <span className="text-[11px] text-emerald-200 block">Deliveries</span>
          <span className="text-xl font-black">{completedOrders}</span>
        </div>
        <div>
          <span className="text-[11px] text-emerald-200 block">Rating</span>
          <span className="text-xl font-black">⭐ {rating}</span>
        </div>
      </div>
    </div>
  );
}
