import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { PRODUCTS } from '../../data/products.js';

const CATEGORIES = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages', 'Snacks', 'Household'];

export const ChooseReplacementModal = ({
  item,
  isOpen,
  onClose,
  onSelectReplacement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (p.id === item.product.id) return false;
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCat && matchesSearch;
    });
  }, [item.product.id, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Choose Replacement Item</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Replacing: <span className="font-bold text-rose-600 line-through">{item.product.name}</span> (₹{item.product.price})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="py-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search replacement items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ₹{product.price} {product.unit ? `• ${product.unit}` : ''}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400">{product.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectReplacement(product);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Select
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching products found. Try adjusting your search query or category filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
