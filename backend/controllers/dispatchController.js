const finalizationService = require('../services/finalizationService');
const { assertOrderIsFinalized, OrderNotFinalizedError } = require('../services/dispatchGuard');
const supabase = require('../lib/supabaseClient');

exports.finalizeOrder = async (req, res) => {
  res.status(200).json({ message: 'Order finalization placeholder' });
};

/**
 * Handles delivery partner assignment requests.
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

    if (!partner) {
      return res.status(503).json({
        error: 'No delivery partners available',
        details: 'All delivery partners are currently busy or offline. Please retry dispatch shortly.',
      });
    }

    const assignedAt = new Date().toISOString();

    console.log('[DISPATCH_ASSIGNMENT]', {
      orderId,
      assignedPartnerId: partner.id,
      partnerName: partner.name,
      assignedAt,
    });

    // 3. Application-level Guard Check
    await assertOrderIsFinalized(orderId);

    // 4. Update order record in Supabase
    const { error: orderUpdateErr } = await supabase
      .from('order_table')
      .update({
        assigned_partner_id: partner.id,
        delivery_partner_id: partner.id,
        assigned_at: assignedAt,
        order_status: 'ASSIGNED',
      })
      .eq('order_id', orderId);

    if (orderUpdateErr) {
      return res.status(400).json({
        error: 'Delivery assignment blocked by database guard rail',
        details: orderUpdateErr.message,
      });
    }

    // 5. Update delivery partner status to BUSY
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

exports.assignDriver = exports.assignDeliveryPartner;

