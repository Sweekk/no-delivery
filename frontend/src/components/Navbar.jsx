import React from 'react';
import { ShoppingCart, Heart, User, MapPin } from 'lucide-react';
import { Logo } from './common/Logo.jsx';
import { SearchBar } from './SearchBar.jsx';

export const Navbar = ({
  userName = 'Alex Morgan',
  deliveryAddress = 'Flat 402, Sector 5, Green Park',
  cartCount = 0,
  cartTotal = 0,
  wishlistCount = 0,
  searchQuery = '',
  onSearchChange,
  onOpenCart,
  onOpenProfile,
  onOpenWishlist,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Left: Logo & Location Selector */}
        <div className="flex items-center gap-4">
          <Logo showTagline={false} />

          {/* Delivery Location Selector Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Delivering to</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[180px] block">{deliveryAddress}</span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <SearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} placeholder="Search 30+ fresh groceries, dairy, snacks..." />
        </div>

        {/* Right: Wishlist, Cart, Profile Icon (NO Picker or Admin items!) */}
        <div className="flex items-center gap-2.5">
          
          {/* Wishlist Icon */}
          <button
            onClick={onOpenWishlist}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer relative"
            title="Wishlist"
          >
            <div className="relative">
              <Heart className="w-4 h-4 text-rose-500" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Wishlist</span>
          </button>

          {/* Cart Icon & Count Badge */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer shadow-xs"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
            {cartTotal > 0 && (
              <span className="font-mono text-emerald-100 font-extrabold ml-1">₹{cartTotal}</span>
            )}
          </button>

          {/* Profile / Account Icon */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
            title="Profile & Account"
          >
            <User className="w-4 h-4 text-slate-700" />
            <span className="hidden sm:inline truncate max-w-[90px]">{userName.split(' ')[0]}</span>
          </button>

        </div>
      </div>
    </header>
  );
};
