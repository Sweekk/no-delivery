import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { PRODUCTS } from '../../data/products.js';
import { CATEGORIES } from '../../data/categories.js';
import { ProductCard } from '../ProductCard.jsx';
import { SearchBar } from '../SearchBar.jsx';

export const CategoryPage = ({
  categoryName,
  cart = [],
  wishlist = [],
  onSelectCategory,
  onBackToHome,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const currentCatObj = CATEGORIES.find(c => c.name === categoryName) || CATEGORIES[0];

  const categoryProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesCategory = p.category === categoryName;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [categoryName, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to All Categories
          </button>
          
          <span className="text-xs font-bold text-slate-500">
            Category View
          </span>
        </div>

        {/* Category Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
              <img src={currentCatObj.image} alt={currentCatObj.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentCatObj.icon}</span>
                <h1 className="text-2xl font-extrabold text-slate-900">{categoryName}</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{currentCatObj.description}</p>
            </div>
          </div>

          <div className="w-full sm:w-auto max-w-xs">
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder={`Search in ${categoryName}...`} />
          </div>
        </div>

        {/* Category Quick Tabs bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer border ${
                c.name === categoryName
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Items Listing Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Products ({categoryProducts.length})
            </h3>
          </div>

          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryProducts.map((product) => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const isWishlisted = wishlist.some(item => item.id === product.id);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cartItem ? cartItem.quantity : 0}
                    isWishlisted={isWishlisted}
                    onAdd={onAddToCart}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleWishlist={onToggleWishlist}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-base font-extrabold text-slate-900">No Items Found</h4>
              <p className="text-xs text-slate-500 font-medium">No products matched "{searchQuery}" in {categoryName}.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
