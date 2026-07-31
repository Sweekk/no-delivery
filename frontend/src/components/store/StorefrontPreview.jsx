import React from 'react';
import { ShoppingBag, Zap, Clock, ShieldCheck, Star, Search, MapPin, Truck, ChevronRight } from 'lucide-react';

export const StorefrontPreview = ({ onOpenLogin }) => {
  const categories = [
    { name: 'Fruits & Vegetables', icon: '🥑', count: '140+ items' },
    { name: 'Dairy, Bread & Eggs', icon: '🥛', count: '95+ items' },
    { name: 'Snacks & Munchies', icon: '🍿', count: '210+ items' },
    { name: 'Cold Drinks & Juices', icon: '🧃', count: '120+ items' },
    { name: 'Instant & Frozen Food', icon: '🍕', count: '85+ items' },
  ];

  const flashDeals = [
    {
      id: '1',
      name: 'Organic Farm Whole Milk 1L',
      weight: '1000 ml',
      price: 65,
      originalPrice: 80,
      discount: '20% OFF',
      rating: 4.9,
      reviews: 128,
      badge: 'Bestseller',
      image: '🥛',
    },
    {
      id: '2',
      name: 'Fresh Organic Hass Avocados',
      weight: '3 pcs pack',
      price: 120,
      originalPrice: 150,
      discount: '20% OFF',
      rating: 4.8,
      reviews: 94,
      badge: 'Farm Fresh',
      image: '🥑',
    },
  ];

  return (
    <div className="w-full space-y-8 animate-fade-in text-left">
      <div className="w-full bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Store Zone</div>
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Green Park Store #402</span>
            </div>
          </div>
        </div>

        <div className="relative flex-1 max-w-xl w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            readOnly
            onClick={onOpenLogin}
            placeholder="Search groceries..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 cursor-pointer hover:border-emerald-500 focus:bg-white focus:outline-none"
          />
          <button
            onClick={onOpenLogin}
            className="absolute right-1.5 top-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};
