import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS } from '../data/orders.js';
import { PRODUCTS } from '../data/products.js';
import { useAuth } from './AuthContext.jsx';

const OrderContext = createContext(undefined);

export const OrderProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser ? (currentUser.id || currentUser.email || 'guest') : 'guest';

  // Helper to load user-specific wishlist from localStorage
  const loadUserWishlist = (uid) => {
    try {
      const key = `freshbasket_wishlist_${uid}`;
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading wishlist from storage:', e);
    }
    // Default initial demo wishlist ONLY for initial demo customer when no storage exists yet
    if (uid === 'usr-1' || uid === 'alex.customer@quickfix.com' || uid.includes('alex')) {
      return [PRODUCTS[0], PRODUCTS[6], PRODUCTS[26]];
    }
    return [];
  };

  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [wishlist, setWishlist] = useState(() => loadUserWishlist(userId));
  const [addresses, setAddresses] = useState([
    'Flat 402, Green Park Residency, Sector 5',
    'Office 12B, Central Business Park, Main Block',
  ]);
  
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Sync wishlist state whenever current logged in user changes
  useEffect(() => {
    setWishlist(loadUserWishlist(userId));
  }, [userId]);

  // Customer's primary active order
  const activeOrder = orders.find(o => o.stage !== 'Completed' && o.stage !== 'Cancelled') || orders[0] || null;

  // Per-User Wishlist Actions with localStorage persistence
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      const updated = exists
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product];

      try {
        localStorage.setItem(`freshbasket_wishlist_${userId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving wishlist to storage:', e);
      }
      return updated;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => {
      const updated = prev.filter(p => p.id !== productId);
      try {
        localStorage.setItem(`freshbasket_wishlist_${userId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving wishlist to storage:', e);
      }
      return updated;
    });
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

  const [activeToast, setActiveToast] = useState(null);

  const showToastNotification = (message, type = 'success') => {
    setActiveToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setActiveToast(null);
    }, 4500);
  };

  // Helper to format selection confirmation notification messages per requirement
  const createNotification = (option, originalName, replacementName = '', isAutoFallback = false) => {
    let message = '';
    let type = 'success';

    if (isAutoFallback) {
      message = `Time expired — ${originalName} was automatically replaced with ${replacementName}.`;
      type = 'warning';
    } else if (option === 'self_pick' || option === 'custom_pick' || option === 'option_i') {
      message = `Your unavailable item ${originalName} has been replaced with ${replacementName}, as chosen by you.`;
      type = 'success';
    } else if (option === 'picker_pick' || option === 'accept_suggested' || option === 'suggested_pick' || option === 'option_ii') {
      message = `Your unavailable item ${originalName} has been replaced with ${replacementName}.`;
      type = 'success';
    } else if (option === 'skip' || option === 'option_iii') {
      message = `Your unavailable item ${originalName} has been skipped and removed from your order.`;
      type = 'info';
    } else {
      message = `Unavailable item ${originalName} decision processed.`;
    }

    // Trigger instant toast notification popup
    showToastNotification(message, type);

    return {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      option,
      originalName,
      replacementName,
      isAutoFallback,
      message,
      type,
    };
  };

  const getSuggestedSubstitute = (product) => {
    const sameCategory = PRODUCTS.filter(
      p => p.category === product.category && p.id !== product.id
    );
    return sameCategory[0] || PRODUCTS.find(p => p.id !== product.id) || null;
  };

  const updateItemAvailability = (orderId, itemId, status) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const now = Date.now();
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                pickingStatus: status,
                unavailableAt: status === 'not_available' ? (item.unavailableAt || now) : undefined,
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

  const completeOrderPicking = (orderId) => {
    const now = Date.now();
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          // Set unavailableAt for items marked not_available
          const updatedItems = order.items.map(item => {
            if (item.pickingStatus === 'not_available') {
              return {
                ...item,
                unavailableAt: item.unavailableAt || now,
              };
            }
            return item;
          });

          const unavailableList = updatedItems
            .filter(item => item.pickingStatus === 'not_available')
            .map(item => ({
              id: item.id,
              product: item.product,
              quantity: item.quantity,
              unavailableAt: item.unavailableAt,
              suggestedSubstitute: getSuggestedSubstitute(item.product),
            }));

          if (unavailableList.length > 0) {
            const notificationPayload = {
              orderId: order.id,
              orderNumber: order.orderNumber,
              unavailableItems: unavailableList,
            };

            return {
              ...order,
              items: updatedItems,
              stage: 'Pending Customer Review',
              consolidatedNotification: notificationPayload,
              hasPendingNotification: true,
              updatedAt: new Date().toISOString(),
            };
          } else {
            return {
              ...order,
              items: updatedItems,
              stage: 'Ready for Delivery',
              consolidatedNotification: null,
              hasPendingNotification: false,
              updatedAt: new Date().toISOString(),
            };
          }
        }
        return order;
      })
    );
  };

  // Timer expiration handler: Defaults automatically to Option ii ("Picker selects relevant replacement")
  const handleItemTimerExpire = (orderId, itemId) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          let newNotif = null;
          const updatedItems = order.items.map(item => {
            if (item.id === itemId && (item.pickingStatus === 'not_available' || item.pickingStatus === 'picker_pending')) {
              const suggested = getSuggestedSubstitute(item.product);
              const originalProd = item.originalProduct || item.product;
              const replacementProd = suggested || item.product;

              newNotif = createNotification(
                'picker_pick',
                originalProd.name,
                replacementProd.name,
                true // isAutoFallback = true
              );

              return {
                ...item,
                originalProduct: originalProd,
                product: replacementProd,
                pickingStatus: 'substituted',
                substitutionChoice: 'picker_pick',
                timerExpired: true,
              };
            }
            return item;
          });

          if (!newNotif) return order; // already resolved

          const remainingUnavailable = updatedItems.filter(i => i.pickingStatus === 'not_available' || i.pickingStatus === 'picker_pending');
          const { subtotal, totalAmount } = recalculateOrderTotals(updatedItems, order.deliveryFee);

          return {
            ...order,
            items: updatedItems,
            subtotal,
            totalAmount,
            notifications: [newNotif, ...(order.notifications || [])],
            hasPendingNotification: remainingUnavailable.length > 0,
            consolidatedNotification: remainingUnavailable.length > 0 ? {
              ...order.consolidatedNotification,
              unavailableItems: remainingUnavailable.map(i => ({
                id: i.id,
                product: i.product,
                quantity: i.quantity,
                unavailableAt: i.unavailableAt,
                suggestedSubstitute: getSuggestedSubstitute(i.product),
              })),
            } : null,
            stage: remainingUnavailable.length === 0 ? 'Ready for Delivery' : order.stage,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  // Finalizes picker selection when picker confirms Option ii choice
  const finalizePickerSelection = (orderId, itemId, replacementProduct = null) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          let newNotif = null;
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              const originalProd = item.originalProduct || item.product;
              const chosen = replacementProduct || getSuggestedSubstitute(item.product);

              newNotif = createNotification(
                'picker_pick',
                originalProd.name,
                chosen.name,
                false
              );

              return {
                ...item,
                originalProduct: originalProd,
                product: chosen,
                pickingStatus: 'substituted',
                substitutionChoice: 'picker_pick',
              };
            }
            return item;
          });

          const remainingUnavailable = updatedItems.filter(i => i.pickingStatus === 'not_available' || i.pickingStatus === 'picker_pending');
          const { subtotal, totalAmount } = recalculateOrderTotals(updatedItems, order.deliveryFee);

          return {
            ...order,
            items: updatedItems,
            subtotal,
            totalAmount,
            notifications: newNotif ? [newNotif, ...(order.notifications || [])] : (order.notifications || []),
            hasPendingNotification: remainingUnavailable.length > 0,
            consolidatedNotification: remainingUnavailable.length > 0 ? {
              ...order.consolidatedNotification,
              unavailableItems: remainingUnavailable.map(i => ({
                id: i.id,
                product: i.product,
                quantity: i.quantity,
                unavailableAt: i.unavailableAt,
                suggestedSubstitute: getSuggestedSubstitute(i.product),
              })),
            } : null,
            stage: remainingUnavailable.length === 0 ? 'Ready for Delivery' : order.stage,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
  };

  const resolveBatchUnavailableItems = (orderId, responses) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          const createdNotifs = [];

          const updatedItems = order.items.map(item => {
            const resp = responses[item.id];
            if (resp && (item.pickingStatus === 'not_available' || item.pickingStatus === 'picker_pending')) {
              const originalProd = item.originalProduct || item.product;

              if (resp.action === 'skip') {
                const notif = createNotification('skip', originalProd.name, '', false);
                createdNotifs.push(notif);
                return {
                  ...item,
                  pickingStatus: 'skipped',
                  substitutionChoice: 'skip',
                };
              }

              let chosen = null;
              let choiceType = 'picker_pick';

              if (resp.action === 'picker_pick' || resp.action === 'accept_suggested') {
                chosen = resp.replacementProduct || getSuggestedSubstitute(item.product);
                choiceType = 'picker_pick';
              } else if (resp.action === 'custom_pick' || resp.action === 'self_pick') {
                chosen = resp.replacementProduct || getSuggestedSubstitute(item.product);
                choiceType = 'self_pick';
              }

              if (chosen) {
                const notif = createNotification(choiceType, originalProd.name, chosen.name, false);
                createdNotifs.push(notif);
                return {
                  ...item,
                  originalProduct: originalProd,
                  product: chosen,
                  pickingStatus: 'substituted',
                  substitutionChoice: choiceType,
                };
              }
            }
            return item;
          });

          const remainingUnavailable = updatedItems.filter(i => i.pickingStatus === 'not_available' || i.pickingStatus === 'picker_pending');
          const { subtotal, totalAmount } = recalculateOrderTotals(updatedItems, order.deliveryFee);

          return {
            ...order,
            items: updatedItems,
            subtotal,
            totalAmount,
            notifications: [...createdNotifs, ...(order.notifications || [])],
            stage: remainingUnavailable.length === 0 ? 'Ready for Delivery' : order.stage,
            consolidatedNotification: remainingUnavailable.length > 0 ? {
              ...order.consolidatedNotification,
              unavailableItems: remainingUnavailable.map(i => ({
                id: i.id,
                product: i.product,
                quantity: i.quantity,
                unavailableAt: i.unavailableAt,
                suggestedSubstitute: getSuggestedSubstitute(i.product),
              })),
            } : null,
            hasPendingNotification: remainingUnavailable.length > 0,
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
          let newNotif = null;

          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              const originalProd = item.originalProduct || item.product;

              if (option === 'skip') {
                newNotif = createNotification('skip', originalProd.name, '', false);
                return {
                  ...item,
                  pickingStatus: 'skipped',
                  substitutionChoice: 'skip',
                };
              }

              let chosenReplacement = replacementProduct;

              if (option === 'picker_pick' || option === 'accept_suggested') {
                const sameCategoryProducts = PRODUCTS.filter(
                  p => p.category === item.product.category && p.id !== item.product.id
                );
                chosenReplacement = replacementProduct || sameCategoryProducts[0] || PRODUCTS.find(p => p.id !== item.product.id);
              }

              if (chosenReplacement) {
                newNotif = createNotification(option, originalProd.name, chosenReplacement.name, false);
                return {
                  ...item,
                  originalProduct: originalProd,
                  product: chosenReplacement,
                  pickingStatus: 'substituted',
                  substitutionChoice: option,
                };
              }
            }
            return item;
          });

          const remainingUnavailable = updatedItems.filter(i => i.pickingStatus === 'not_available' || i.pickingStatus === 'picker_pending');
          const { subtotal, totalAmount } = recalculateOrderTotals(updatedItems, order.deliveryFee);

          return {
            ...order,
            items: updatedItems,
            subtotal,
            totalAmount,
            notifications: newNotif ? [newNotif, ...(order.notifications || [])] : (order.notifications || []),
            hasPendingNotification: remainingUnavailable.length > 0,
            consolidatedNotification: remainingUnavailable.length > 0 ? {
              ...order.consolidatedNotification,
              unavailableItems: remainingUnavailable.map(i => ({
                id: i.id,
                product: i.product,
                quantity: i.quantity,
                unavailableAt: i.unavailableAt,
                suggestedSubstitute: getSuggestedSubstitute(i.product),
              })),
            } : null,
            stage: remainingUnavailable.length === 0 ? 'Ready for Delivery' : order.stage,
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
        completeOrderPicking,
        resolveBatchUnavailableItems,
        resolveUnavailableItem,
        finalizePickerSelection,
        handleItemTimerExpire,
        activeToast,
        showToastNotification,
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


