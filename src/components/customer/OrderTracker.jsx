import React from 'react';
import { CheckCircle2, Clock, Package, ShieldCheck } from 'lucide-react';

const STAGES = [
  { stage: 'Order Placed', label: 'Order Placed', icon: <Clock className="w-4 h-4" /> },
  { stage: 'Picking Items', label: 'Item Verification', icon: <Package className="w-4 h-4" /> },
  { stage: 'Items Verified', label: 'Stock Verified', icon: <ShieldCheck className="w-4 h-4" /> },
  { stage: 'Ready for Pickup / Delivery', label: 'Ready', icon: <CheckCircle2 className="w-4 h-4" /> },
  { stage: 'Completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export const OrderTracker = ({ currentStage }) => {
  const getStageIndex = (stage) => {
    switch (stage) {
      case 'Order Placed': return 0;
      case 'Picking Items': return 1;
      case 'Items Verified': return 2;
      case 'Ready for Pickup / Delivery': return 3;
      case 'Completed': return 4;
      case 'Cancelled': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  if (currentStage === 'Cancelled') {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center">
        ❌ Order Cancelled
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-left">
      <h4 className="text-sm font-extrabold text-slate-900">Order Progress</h4>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={step.label}
              className={`p-3 rounded-2xl border text-xs flex flex-col justify-between space-y-2 transition ${
                isCurrent
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{step.icon}</span>
                <span className="text-[10px] font-mono">0{idx + 1}</span>
              </div>
              <span className="font-extrabold text-[11px] leading-tight">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
