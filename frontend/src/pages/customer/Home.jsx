import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { PRODUCTS } from '../../data/products.js';
import { Navbar } from '../../components/Navbar.jsx';
import { SearchBar } from '../../components/SearchBar.jsx';
import { BannerCarousel } from '../../components/BannerCarousel.jsx';
import { PromoSubBanners } from '../../components/PromoSubBanners.jsx';
import { CategoryGrid } from '../../components/CategoryGrid.jsx';
import { ProductCard } from '../../components/ProductCard.jsx';
import { FloatingCart } from '../../components/FloatingCart.jsx';

import { Cart } from './Cart.jsx';
import { Checkout } from './Checkout.jsx';
import { OrderStatus } from './OrderStatus.jsx';
import { CategoryPage } from '../../components/customer/CategoryPage.jsx';
import { ProfileSection } from '../../components/customer/ProfileSection.jsx';
import { OrderConfirmationModal } from '../../components/customer/OrderConfirmationModal.jsx';

import { useOrders } from '../../context/OrderContext.jsx';

export const Home = ({
  userName = 'Alex Morgan',
  userEmail = 'alex.customer@quickfix.com',
  onLogout,
}) => {
  const {
    createOrder,
    activeOrder,
    wishlist,
    toggleWishlist,
    removeFromWishlist,
    addresses,
    addAddress,
    deleteAddress,
    lastCreatedOrder,
    showConfirmationModal,
    setShowConfirmationModal,
  } = useOrders();
  
  const [customerView, setCustomerView] = useState('catalogue');
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [profileTab, setProfileTab] = useState('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  // Auto-switch to order_status view when 3-minute picker review notification arrives
  useEffect(() => {
    if ((activeOrder?.hasPendingNotification || activeOrder?.stage === 'Pending Customer Review') && customerView !== 'order_status') {
      setCustomerView('order_status');
    }
  }, [activeOrder?.hasPendingNotification, activeOrder?.stage, customerView]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesSearch;
    });
  }, [searchQuery]);

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const totalCartPrice = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cart]
  );

  const handleCategorySelect = (categoryName) => {
    setSelectedCategoryName(categoryName);
    setCustomerView('category_detail');
  };

  const handleProceedToCheckout = () => {
    setCustomerView('checkout');
  };

  const handlePlaceOrder = (address) => {
    createOrder(cart, address);
    setCart([]);
    setCustomerView('catalogue');
  };

  // 1. CATEGORY DETAIL PAGE
  if (customerView === 'category_detail' && selectedCategoryName) {
    return (
      <CategoryPage
        categoryName={selectedCategoryName}
        cart={cart}
        wishlist={wishlist}
        onSelectCategory={handleCategorySelect}
        onBackToHome={() => setCustomerView('catalogue')}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onToggleWishlist={toggleWishlist}
      />
    );
  }

  // 2. PROFILE & ACCOUNT TABS VIEW
  if (customerView === 'profile') {
    return (
      <ProfileSection
        userName={userName}
        userEmail={userEmail}
        wishlist={wishlist}
        cart={cart}
        addresses={addresses}
        activeTab={profileTab}
        onSelectTab={setProfileTab}
        onBackToStore={() => setCustomerView('catalogue')}
        onLogout={onLogout}
        onAddToCart={handleAddToCart}
        onRemoveFromWishlist={removeFromWishlist}
        onAddAddress={addAddress}
        onDeleteAddress={deleteAddress}
      />
    );
  }

  // 3. CART VIEW
  if (customerView === 'cart') {
    return (
      <Cart
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
        onBackToHome={() => setCustomerView('catalogue')}
      />
    );
  }

  // 4. CHECKOUT VIEW
  if (customerView === 'checkout') {
    return (
      <Checkout
        cart={cart}
        onPlaceOrder={handlePlaceOrder}
        onBackToCart={() => setCustomerView('cart')}
      />
    );
  }

  // 5. ORDER STATUS VIEW
  if (customerView === 'order_status') {
    return (
      <OrderStatus onBackToHome={() => setCustomerView('catalogue')} />
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Immediate Order Confirmation Modal */}
      <OrderConfirmationModal
        order={lastCreatedOrder}
        isOpen={showConfirmationModal}
        onTrackOrder={() => {
          setShowConfirmationModal(false);
          setCustomerView('order_status');
        }}
        onContinueShopping={() => {
          setShowConfirmationModal(false);
          setCustomerView('catalogue');
        }}
      />

      {/* Top Navbar */}
      <Navbar
        userName={userName}
        deliveryAddress={addresses[0] || 'Flat 402, Green Park Residency'}
        cartCount={totalCartCount}
        cartTotal={totalCartPrice}
        wishlistCount={wishlist.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setCustomerView('cart')}
        onOpenWishlist={() => {
          setProfileTab('wishlist');
          setCustomerView('profile');
        }}
        onOpenProfile={() => {
          setProfileTab('orders');
          setCustomerView('profile');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 text-left">
        
        {/* Active Order Shortcut Banner */}
        {activeOrder && activeOrder.stage !== 'Completed' && activeOrder.stage !== 'Cancelled' && (
          <div className="bg-emerald-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Active Order</p>
                <p className="text-sm font-extrabold">Order #{activeOrder.orderNumber} • Stage: {activeOrder.stage}</p>
              </div>
            </div>
            <button
              onClick={() => setCustomerView('order_status')}
              className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs hover:bg-emerald-50 transition cursor-pointer"
            >
              Track Order
            </button>
          </div>
        )}

        {/* Mobile Search Bar */}
        <div className="md:hidden">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </div>

        {/* Hero Banner Carousel (Blinkit Style) */}
        <BannerCarousel onSelectCategory={handleCategorySelect} />

        {/* Promotional Sub-Banners Row */}
        <PromoSubBanners onSelectCategory={handleCategorySelect} />

        {/* Category Grid (Blinkit Style) */}
        <CategoryGrid onSelectCategory={handleCategorySelect} />

        {/* Featured Grocery Products Listing */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Popular Grocery Essentials</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {filteredProducts.length} items
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id);
              const isWishlisted = wishlist.some((item) => item.id === product.id);

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cartItem ? cartItem.quantity : 0}
                  isWishlisted={isWishlisted}
                  onAdd={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleWishlist={toggleWishlist}
                />
              );
            })}
          </div>
        </div>

      </main>

      {/* Floating Cart Button */}
      <FloatingCart cartItems={cart} onOpenCart={() => setCustomerView('cart')} />

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 FreshBasket Grocery Shopping App. Student Academic Project.</span>
          <span className="font-semibold text-slate-600">Customer Frontend Submission</span>
        </div>
      </footer>

    </div>
  );
};
