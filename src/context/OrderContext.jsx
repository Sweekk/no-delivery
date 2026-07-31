import React, { createContext, useContext, useState } from 'react';
import { INITIAL_ORDERS } from '../data/orders.js';
import { PRODUCTS } from '../data/products.js';

const OrderContext = createContext(undefined);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [wishlist, setWishlist] = useState([PRODUCTS[0], PRODUCTS[6], PRODUCTS[26]]);
  const [addresses, setAddresses] = useState([
    'Flat 402, Green Park Residency, Sector 5',
    'Office 12B, Central Business Park, Main Block',
  ]);
  
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Customer's primary active order
  const activeOrder = orders.find(o => o.stage !== 'Completed' && o.stage !== 'Cancelled') || orders[0] || null;

  // Wishlist Actions
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(p => p.id === productId);
  };

  // Address Actions
  const addAddress = (newAddressText) => {
    setAddresses(prev => [newAddressText, ...prev]);
  };

  const deleteAddress = (index) => {
    setAddresses(prev => prev.filter((_, idx) => idx !== index));
  };

  // Helper to recalculate order totals
  const recalculateOrderTotals = (items, deliveryFee) => {
    const subtotal = items.reduce((acc, item) => {
      if (item.pickingStatus === 'skipped') return acc;
      return acc + item.product.price * item.quantity;
    }, 0);
    return {
      subtotal,
      totalAmount: subtotal + deliveryFee,
    };
  };

  const createOrder = (cart, deliveryAddress) => {
    const deliveryFee = 30;
    const initialItems = cart.map((item, idx) => ({
      id: `oi-${Date.now()}-${idx}`,
      product: item.product,
      quantity: item.quantity,
      pickingStatus: 'pending',
    }));

    const { subtotal, totalAmount } = recalculateOrderTotals(initialItems, deliveryFee);

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Alex Morgan',
      customerPhone: '+91 98765-12345',
      deliveryAddress: deliveryAddress || addresses[0] || 'Flat 402, Green Park Residency, Sector 5',
      storeName: 'QuickFix Green Park Store #402',
      items: initialItems,
      subtotal,
      deliveryFee,
      totalAmount,
      stage: 'Order Placed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cancellationAllowed: true,
    };

    setOrders(prev => [newOrder, ...prev]);
    setLastCreatedOrder(newOrder);
    setShowConfirmationModal(true);
    return newOrder;
  };

  const cancelOrder = (orderId) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId && order.cancellationAllowed) {
          return {
            ...order,
            stage: 'Cancelled',
            cancellationAllowed: false,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  const updateItemAvailability = (orderId, itemId, status) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                pickingStatus: status,
              };
            }
            return item;
          });

          return {
            ...order,
            items: updatedItems,
            stage: 'Picking Items',
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  const resolveUnavailableItem = (orderId, itemId, option, replacementProduct) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              if (option === 'skip') {
                return {
                  ...item,
                  pickingStatus: 'skipped',
                  substitutionChoice: 'skip',
                };
              }

              let chosenReplacement = replacementProduct;

              if (option === 'picker_pick') {
                const sameCategoryProducts = PRODUCTS.filter(
                  p => p.category === item.product.category && p.id !== item.product.id
                );
                chosenReplacement = sameCategoryProducts[0] || PRODUCTS.find(p => p.id !== item.product.id);
              }

              if (chosenReplacement) {
                return {
                  ...item,
                  originalProduct: item.originalProduct || item.product,
                  product: chosenReplacement,
                  pickingStatus: 'substituted',
                  substitutionChoice: option,
                };
              }
            }
            return item;
          });

          const { subtotal, totalAmount } = recalculateOrderTotals(updatedItems, order.deliveryFee);

          return {
            ...order,
            items: updatedItems,
            subtotal,
            totalAmount,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        wishlist,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        addresses,
        addAddress,
        deleteAddress,
        createOrder,
        cancelOrder,
        updateItemAvailability,
        resolveUnavailableItem,
        lastCreatedOrder,
        showConfirmationModal,
        setShowConfirmationModal,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
