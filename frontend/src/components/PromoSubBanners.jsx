import React from 'react';
import { SUB_BANNERS } from '../data/banners.js';

export const PromoSubBanners = ({ onSelectCategory }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
      {SUB_BANNERS.map((banner) => (
        <div
          key={banner.id}
          onClick={() => onSelectCategory(banner.category)}
          className={`p-4 rounded-2xl border ${banner.bgColor} cursor-pointer flex items-center justify-between gap-3 shadow-xs`}
        >
          <div className="space-y-1">
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${banner.badgeColor}`}>
              {banner.discount}
            </span>
            <h4 className={`text-sm font-extrabold ${banner.textColor}`}>
              {banner.title}
            </h4>
            <span className="text-[11px] font-bold text-slate-500 underline block pt-0.5">
              Shop Category →
            </span>
          </div>

          <img
            src={banner.image}
            alt={banner.title}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
          />
        </div>
      ))}
    </div>
  );
};
