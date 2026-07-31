import React, { useState } from 'react';
import { User, ShoppingBag, MapPin, Heart, ShoppingCart, LogOut, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useOrders } from '../../context/OrderContext.jsx';

export const ProfileSection = ({
  userName = 'Alex Morgan',
  userEmail = 'alex.customer@quickfix.com',
  wishlist = [],
  cart = [],
  addresses = [],
  activeTab = 'orders',
  onSelectTab,
  onBackToStore,
  onLogout,
  onAddToCart,
  onRemoveFromWishlist,
  onAddAddress,
  onDeleteAddress,
}) => {
  const { orders } = useOrders();
  const [newAddressText, setNewAddressText] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (newAddressText.trim()) {
      onAddAddress(newAddressText.trim());
      setNewAddressText('');
      setShowAddressForm(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Store
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg">
              {userName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{userName}</h2>
              <p className="text-xs text-slate-500 font-medium">{userEmail} • Customer Account</p>
            </div>
          </div>
        </div>

        {/* Tabs: Orders | Addresses | Wishlist | Cart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
            <button
              onClick={() => onSelectTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Order History ({orders.length})
            </button>

            <button
              onClick={() => onSelectTab('addresses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border ${
                activeTab === 'addresses'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" /> Saved Addresses ({addresses.length})
            </button>

            <button
              onClick={() => onSelectTab('wishlist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border ${
                activeTab === 'wishlist'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Heart className="w-4 h-4" /> Wishlist ({wishlist.length})
            </button>

            <button
              onClick={() => onSelectTab('cart')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border ${
                activeTab === 'cart'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Cart Items ({cart.length})
            </button>
          </div>

          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Your Past Orders</h3>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">Order #{order.orderNumber}</span>
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                          {order.stage}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium">
                        {order.items.length} items • Total: <strong className="text-slate-900 font-mono">₹{order.totalAmount}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">Delivered to: {order.deliveryAddress}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No past orders placed yet.</p>
              )}
            </div>
          )}

          {/* TAB 2: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Saved Delivery Addresses</h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Enter Address Details</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Green Park Residency, Sector 5"
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{addr}</span>
                    </div>
                    {addresses.length > 1 && (
                      <button
                        onClick={() => onDeleteAddress(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Your Saved Wishlist Items</h3>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-extrabold text-slate-900">{item.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">₹{item.price} {item.unit ? `• ${item.unit}` : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onAddToCart(item)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => onRemoveFromWishlist(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No items saved to your wishlist yet.</p>
              )}
            </div>
          )}

          {/* TAB 4: CART SUMMARY */}
          {activeTab === 'cart' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Current Basket Contents</h3>
              {cart.length > 0 ? (
                <div className="space-y-2.5">
                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-900">{product.name} (×{quantity})</span>
                      <span className="font-mono font-bold text-emerald-700">₹{product.price * quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">Your shopping cart is currently empty.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
