import React from 'react';
import { CATEGORIES } from '../data/categories.js';

export const CategoryGrid = ({ onSelectCategory }) => {
  return (
    <div className="w-full space-y-3 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
          Explore Grocery Categories
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          {CATEGORIES.length} categories available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.name)}
            className="p-3 rounded-2xl bg-white border border-slate-200 text-left cursor-pointer flex flex-col items-center justify-between space-y-2.5 shadow-xs"
          >
            <div className="w-full h-24 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center relative">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1.5 right-1.5 bg-white/90 text-slate-900 text-xs px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                {cat.icon}
              </span>
            </div>

            <div className="w-full text-center">
              <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">
                {cat.name}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                {cat.itemCount}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
