import React from 'react';

const CATEGORIES = [
  { label: 'All', icon: '🛒' },
  { label: 'Fruits', icon: '🍎' },
  { label: 'Vegetables', icon: '🥦' },
  { label: 'Dairy', icon: '🥛' },
  { label: 'Bakery', icon: '🍞' },
  { label: 'Beverages', icon: '🧃' },
  { label: 'Snacks', icon: '🍿' },
  { label: 'Household', icon: '🧹' },
];

export const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => onSelectCategory(isSelected && cat.label !== 'All' ? 'All' : cat.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200 shadow-xs'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
