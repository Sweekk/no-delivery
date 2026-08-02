import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS } from '../data/orders.js';
import { PRODUCTS } from '../data/products.js';
import { useAuth } from './AuthContext.jsx';

const PRODUCT_NAMES_MAP = {
  'e0000001-0000-0000-0000-000000000001': 'Organic Bananas 6pcs',
  'e0000002-0000-0000-0000-000000000002': 'Amul Taaza Toned Milk 1L',
  'e0000003-0000-0000-0000-000000000003': 'Whole Wheat Bread 400g',
  'e0000004-0000-0000-0000-000000000004': 'Fortune Sunflower Oil 1L',
  'e0000005-0000-0000-0000-000000000005': 'Doritos Nacho Cheese 150g',
  'e0000006-0000-0000-0000-000000000006': 'Fresh Tomatoes 1kg',
  'a0000000-0000-0000-0000-000000000001': 'Fuji Apples (Organic)',
  'a0000000-0000-0000-0000-000000000002': 'Fresh Milk (1 Gallon)',
  'a0000000-0000-0000-0000-000000000003': 'Organic Bananas (Bundle)',
  'a0000000-0000-0000-0000-000000000004': 'Whole Wheat Sourdough',
  'a0000000-0000-0000-0000-000000000005': 'Honey Oat Cereal Box',
  'a0000000-0000-0000-0000-000000000006': 'Pasture-Raised Eggs (Dozen)',
  'APPLE-FUJI-01': 'Fuji Apples (Organic)',
  'MILK-GAL-02': 'Fresh Milk (1 Gallon)',
  'BANANA-ORG-03': 'Organic Bananas (bundle)',
  'BREAD-WW-04': 'Whole Wheat Sourdough',
  'CEREAL-BOX-05': 'Honey Oat Cereal Box',
  'EGGS-DOZ-06': 'Pasture-Raised Eggs (Dozen)'
};

export function getProductName(rawVal) {
  if (!rawVal) return 'Grocery Item';
  if (PRODUCT_NAMES_MAP[rawVal]) return PRODUCT_NAMES_MAP[rawVal];
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawVal)) {
    return 'Organic Grocery Item';
  }
  return rawVal;
}

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

  // 2-second background polling to sync live active order status from Supabase
  useEffect(() => {
    let isMounted = true;
    async function syncActiveOrder() {
      const targetOrderId = lastCreatedOrder?.order_id || activeOrder?.order_id || activeOrder?.id;
      if (!targetOrderId || typeof targetOrderId !== 'string' || targetOrderId.startsWith('ord-17')) return;

      try {
        const res = await fetch(`/api/customer/order/${targetOrderId}/status`, { cache: 'no-store' });
        if (res.ok && isMounted) {
          const dbData = await res.json();
          if (dbData && dbData.items) {
            const awaitingItems = dbData.items.filter(i => String(i.status).toLowerCase() === 'awaiting_customer' || String(i.status).toLowerCase() === 'not_found');
            
            if (awaitingItems.length > 0 || dbData.order_status === 'AWAITING_SUBSTITUTION') {
              setOrders(prev => {
                const existing = prev.find(o => o.order_id === targetOrderId || o.id === targetOrderId);
                if (existing && existing.hasPendingNotification && existing.stage === 'Pending Customer Review') {
                  return prev; // Prevent infinite re-render loop
                }

                return prev.map(o => {
                  if (o.order_id === targetOrderId || o.id === targetOrderId) {
                    const unavailableList = awaitingItems.map(i => {
                      // Use backend-provided product_name instead of raw UUID
                      const displayName = i.product_name || getProductName(i.item_id);
                      const itemPrice = parseFloat(i.price || i.item_price) || 60;
                      
                      // Use backend-provided suggested substitute if available
                      const backendSub = i.suggested_substitute;
                      const suggestedSub = backendSub 
                        ? { id: backendSub.id, name: backendSub.name, price: parseFloat(backendSub.price) || 54, image: backendSub.image }
                        : { id: 'sub-1', name: 'Similar Product', price: itemPrice };

                      return {
                        id: i.list || i.list_id,
                        product: {
                          id: i.list || i.list_id,
                          name: displayName,
                          price: itemPrice,
                          category: i.category || null,
                          image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80'
                        },
                        quantity: i.qty_requested || 1,
                        unavailableAt: i.unavailable_marked_at ? new Date(i.unavailable_marked_at).getTime() : Date.now(),
                        suggestedSubstitute: suggestedSub,
                        allSubstitutes: i.all_substitutes || []
                      };
                    });

                    return {
                      ...o,
                      stage: unavailableList.length > 0 ? 'Pending Customer Review' : (dbData.order_status === 'FINALIZED' ? 'Ready for Delivery' : o.stage),
                      hasPendingNotification: unavailableList.length > 0,
                      consolidatedNotification: unavailableList.length > 0 ? {
                        orderId: targetOrderId,
                        orderNumber: `ORD-${String(targetOrderId).slice(0, 8)}`,
                        unavailableItems: unavailableList
                      } : null
                    };
                  }
                  return o;
                });
              });
            }
          }
        }
      } catch (err) {
        console.warn('Sync order status notice:', err);
      }
    }

    syncActiveOrder();
    const interval = setInterval(syncActiveOrder, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lastCreatedOrder?.order_id]);

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

  const createOrder = async (cart, deliveryAddress) => {
    const deliveryFee = 30;
    const initialItems = cart.map((item, idx) => ({
      id: `oi-${Date.now()}-${idx}`,
      product: item.product,
      quantity: item.quantity,
      pickingStatus: 'pending',
    }));

    const { subtotal, totalAmount } = recalculateOrderTotals(initialItems, deliveryFee);

    let realOrderId = `ord-${Date.now()}`;

    // POST order to Supabase database backend
    try {
      const payload = {
        store_id: '467a74f5-cc56-47a1-b932-c33dde36132e',
        total_amount: totalAmount,
        items: cart.map(item => ({
          product_name: item.product.name,
          item_id: item.product.uuid || item.product.id || 'e0000001-0000-0000-0000-000000000001',
          qty_requested: item.quantity,
          sub_rules: item.sub_rules || 'ask'
        }))
      };

      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const dbData = await res.json();
        if (dbData.order_id) {
          realOrderId = dbData.order_id;
        }

        // Broadcast real-time order event for instant picker alert
        try {
          window.dispatchEvent(new CustomEvent('new_order_placed', { detail: dbData }));
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('quickfix_orders');
            bc.postMessage({ type: 'NEW_ORDER', order_id: dbData.order_id });
            setTimeout(() => bc.close(), 1000);
          }
        } catch (evtErr) {
          console.log('Event notification error:', evtErr);
        }
      }
    } catch (err) {
      console.error('[DATABASE_ERROR] Failed to save customer order to Supabase:', err);
    }

    const newOrder = {
      id: realOrderId,
      order_id: realOrderId,
      orderNumber: `ORD-${String(realOrderId).slice(0, 8)}`,
      customerName: 'Alex Morgan',
      customerPhone: '+91 98765-12345',
      deliveryAddress: deliveryAddress || addresses[0] || 'Flat 402, Green Park Residency, Sector 5',
      storeName: 'QuickFix Indiranagar Dark Store',
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

  const resolveBatchUnavailableItems = async (orderId, responses) => {
    // Send backend PATCH request for each item decision to persist in Supabase
    for (const itemId of Object.keys(responses)) {
      const resp = responses[itemId];
      const decision = resp.action === 'skip' ? 'skip' : (resp.action === 'custom_pick' || resp.action === 'self_pick' ? 'self_select' : 'picker_choice');
      const subProdId = resp.replacementProduct?.id || resp.replacementProduct?.uuid || null;

      try {
        await fetch(`/api/orders/${orderId}/items/${itemId}/decision`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_decision: decision,
            substitute_product_id: subProdId
          })
        });
      } catch (err) {
        console.warn('Backend decision PATCH notice:', err);
      }
    }

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


