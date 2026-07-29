const finalizationService = require('../services/finalizationService');
const { assertOrderIsFinalized, OrderNotFinalizedError } = require('../services/dispatchGuard');
const supabase = require('../lib/supabaseClient');

exports.finalizeOrder = async (req, res) => {
  res.status(200).json({ message: 'Order finalization placeholder' });
};

/**
 * Handles delivery partner assignment requests.
 * 
 * Defense-in-Depth Architecture:
 * 1. Controller-level gate check via finalizationService.isOrderFinalized().
 * 2. Application-level guard rail via dispatchGuard.assertOrderIsFinalized() executed directly
 *    before the database UPDATE call.
 * 3. Database-level BEFORE UPDATE trigger on orders table as hard stop.
 */
exports.assignDeliveryPartner = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.body.orderId;
    const requestedPartnerId = req.body.deliveryPartnerId;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order not finalized, cannot assign delivery',
        details: 'Missing orderId parameter',
      });
    }

    // 1. Gate check: must be finalized and all items resolved
    const finalized = await finalizationService.isOrderFinalized(orderId);
    if (!finalized) {
      return res.status(400).json({
        error: 'Order not finalized, cannot assign delivery',
      });
    }

    // 2. Pick an available delivery partner
    let partner = null;

    if (requestedPartnerId) {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('id', requestedPartnerId)
        .eq('status', 'AVAILABLE')
        .single();
      if (!error && data) {
        partner = data;
      }
    }

    if (!partner) {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('status', 'AVAILABLE')
        .limit(1);

      if (!error && data && data.length > 0) {
        partner = data[0];
      }
    }

    // 3. Handle no available delivery partners (HTTP 503 Service Unavailable)
    if (!partner) {
      return res.status(503).json({
        error: 'No delivery partners available',
        details: 'All delivery partners are currently busy or offline. Please retry dispatch shortly.',
      });
    }

    const assignedAt = new Date().toISOString();

    // 4. Log timestamp for admin analytics
    console.log('[DISPATCH_ASSIGNMENT]', {
      orderId,
      assignedPartnerId: partner.id,
      partnerName: partner.name,
      assignedAt,
    });

    // 5. APPLICATION-LEVEL GUARD: Assert order is finalized right before DB write
    await assertOrderIsFinalized(orderId);

    // 6. Update order record in Supabase (Protected by DB-level Trigger)
    const { error: orderUpdateErr } = await supabase
      .from('orders')
      .update({
        assigned_partner_id: partner.id,
        delivery_partner_id: partner.id,
        assigned_at: assignedAt,
        status: 'ASSIGNED',
      })
      .eq('id', orderId);

    if (orderUpdateErr) {
      // Database Trigger rejection or constraint violation
      return res.status(400).json({
        error: 'Delivery assignment blocked by database guard rail',
        details: orderUpdateErr.message,
      });
    }

    // 7. Update delivery partner status to BUSY
    await supabase
      .from('delivery_partners')
      .update({ status: 'BUSY' })
      .eq('id', partner.id);

    return res.status(200).json({
      message: 'Delivery partner assigned successfully',
      orderId,
      assigned_at: assignedAt,
      assignedPartner: {
        id: partner.id,
        name: partner.name,
        status: 'BUSY',
      },
    });
  } catch (error) {
    if (error instanceof OrderNotFinalizedError || error.name === 'OrderNotFinalizedError') {
      return res.status(400).json({
        error: 'Delivery assignment blocked by guard rail',
        details: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to assign delivery partner',
      details: error.message,
    });
  }
};

// Alias for backwards compatibility
exports.assignDriver = exports.assignDeliveryPartner;

