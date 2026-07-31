import React, { useState } from 'react';
import { Plus, Minus, Heart, ShoppingBag } from 'lucide-react';

export const ProductCard = ({
  product,
  quantity,
  isWishlisted = false,
  onAdd,
  onUpdateQuantity,
  onToggleWishlist,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 text-left relative">
      
      {/* Wishlist Heart Toggle Button */}
      <button
        onClick={() => onToggleWishlist(product)}
        className={`absolute top-5 right-5 z-10 p-1.5 rounded-full border cursor-pointer ${
          isWishlisted
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-white/90 border-slate-200 text-slate-400 hover:text-slate-600'
        }`}
        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
      </button>

      <div>
        {/* Category Badge */}
        <div className="flex items-center justify-between gap-1 mb-2 pr-8">
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {product.category}
          </span>
        </div>

        {/* Product Image Container */}
        <div className="w-full h-36 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden mb-3 flex items-center justify-center relative">
          {product.image && !imageError ? (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center space-y-1">
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">{product.name}</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
          {product.name}
        </h4>
        {product.unit && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">{product.unit}</p>
        )}
      </div>

      {/* Price & Quantity Controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-base font-extrabold text-slate-900">₹{product.price}</span>
        </div>

        {quantity === 0 ? (
          <button
            onClick={() => onAdd(product)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-600 text-white px-2 py-1 rounded-xl shadow-xs">
            <button
              onClick={() => onUpdateQuantity(product.id, -1)}
              className="p-0.5 cursor-pointer text-white"
              title="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-extrabold px-1 font-mono">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(product.id, 1)}
              className="p-0.5 cursor-pointer text-white"
              title="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
