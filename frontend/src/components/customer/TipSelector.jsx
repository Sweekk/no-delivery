import React, { useState } from 'react';
import { Heart, Check } from 'lucide-react';

const PRESETS = [10, 20, 50];

export const TipSelector = ({ currentTip, onSelectTip }) => {
  const [customInput, setCustomInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(customInput);
    if (!isNaN(val) && val > 0) {
      onSelectTip(val);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Optional Tip</h4>
            <p className="text-[11px] text-slate-500 font-medium">Support store staff</p>
          </div>
        </div>

        {currentTip > 0 && (
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Added: ₹{currentTip}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((amount) => {
          const isSelected = currentTip === amount;
          return (
            <button
              key={amount}
              onClick={() => {
                onSelectTip(amount);
                setSubmitted(true);
                setTimeout(() => setSubmitted(false), 1800);
              }}
              className={`py-2 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              ₹{amount}
            </button>
          );
        })}

        <button
          onClick={() => onSelectTip(0)}
          className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
            currentTip === 0
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          No Tip
        </button>
      </div>

      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="number"
          placeholder="Custom tip ₹"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
        />
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
        >
          Apply
        </button>
      </form>

      {submitted && (
        <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
          <Check className="w-3.5 h-3.5 text-emerald-600" /> Tip updated!
        </div>
      )}
    </div>
  );
};
