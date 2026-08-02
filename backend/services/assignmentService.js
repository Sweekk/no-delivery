const supabase = require('../lib/supabaseClient');

/**
 * Least-busy auto-assignment service for Pickers and Delivery Partners.
 * Selects the available worker with the fewest currently active assignments.
 * Uses round-robin / earliest assigned timestamp as tie-breaker.
 */

const DEFAULT_PICKER_UUID = 'd9aeadd7-9baf-491e-add8-df94d46f8dcb';

exports.assignPicker = async (orderId) => {
  try {
    // 1. Fetch available pickers from users table where role = 'picker'
    const { data: pickers, error: pickersErr } = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 'picker');

    let selectedPickerId = DEFAULT_PICKER_UUID;

    if (!pickersErr && pickers && pickers.length > 0) {
      const pickerIds = pickers.map(p => p.id);

      // 2. Count active assignments per picker
      const { data: counts, error: countsErr } = await supabase
        .from('assignments')
        .select('picker_id, assigned_at')
        .eq('role', 'picker')
        .eq('status', 'active');

      const loadMap = {};
      const lastAssignedMap = {};

      pickerIds.forEach(id => {
        loadMap[id] = 0;
        lastAssignedMap[id] = 0;
      });

      if (!countsErr && counts) {
        counts.forEach(row => {
          if (row.picker_id && loadMap[row.picker_id] !== undefined) {
            loadMap[row.picker_id] += 1;
            const ts = new Date(row.assigned_at).getTime();
            if (ts > lastAssignedMap[row.picker_id]) {
              lastAssignedMap[row.picker_id] = ts;
            }
          }
        });
      }

      // 3. Sort pickers by active load (ascending), tie-breaker: least recently assigned (ascending)
      pickers.sort((a, b) => {
        const loadA = loadMap[a.id] || 0;
        const loadB = loadMap[b.id] || 0;
        if (loadA !== loadB) return loadA - loadB;
        return (lastAssignedMap[a.id] || 0) - (lastAssignedMap[b.id] || 0);
      });

      selectedPickerId = pickers[0].id;
    }

    // 4. Insert assignment record into assignments table
    const { data: assignmentRecord, error: insertAssignErr } = await supabase
      .from('assignments')
      .insert([{
        order_id: orderId,
        picker_id: selectedPickerId,
        role: 'picker',
        status: 'active',
        assigned_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertAssignErr) {
      console.warn('[ASSIGNMENT] Notice inserting assignment record:', insertAssignErr.message);
    }

    // 5. Update order status to 'assigned_to_picker' in order_table
    await supabase
      .from('order_table')
      .update({
        picker_id: selectedPickerId,
        order_status: 'assigned_to_picker'
      })
      .eq('order_id', orderId);

    console.log(`[ASSIGNMENT] Order ${orderId} auto-assigned to picker ${selectedPickerId}`);
    return { picker_id: selectedPickerId, assignment: assignmentRecord };

  } catch (err) {
    console.error('[ASSIGNMENT_ERROR] assignPicker failed:', err);
    // Fallback update
    await supabase
      .from('order_table')
      .update({
        picker_id: DEFAULT_PICKER_UUID,
        order_status: 'assigned_to_picker'
      })
      .eq('order_id', orderId);

    return { picker_id: DEFAULT_PICKER_UUID };
  }
};

exports.assignDeliveryPartner = async (orderId) => {
  try {
    // 1. Fetch available delivery partners
    const { data: partners, error: partnersErr } = await supabase
      .from('delivery_partners')
      .select('id, name, status');

    let selectedPartnerId = null;

    if (!partnersErr && partners && partners.length > 0) {
      const partnerIds = partners.map(p => p.id);

      // 2. Count active delivery assignments
      const { data: counts, error: countsErr } = await supabase
        .from('assignments')
        .select('delivery_partner_id, assigned_at')
        .eq('role', 'delivery')
        .eq('status', 'active');

      const loadMap = {};
      const lastAssignedMap = {};

      partnerIds.forEach(id => {
        loadMap[id] = 0;
        lastAssignedMap[id] = 0;
      });

      if (!countsErr && counts) {
        counts.forEach(row => {
          if (row.delivery_partner_id && loadMap[row.delivery_partner_id] !== undefined) {
            loadMap[row.delivery_partner_id] += 1;
            const ts = new Date(row.assigned_at).getTime();
            if (ts > lastAssignedMap[row.delivery_partner_id]) {
              lastAssignedMap[row.delivery_partner_id] = ts;
            }
          }
        });
      }

      // Sort by fewest active assignments, round-robin tiebreaker
      partners.sort((a, b) => {
        const loadA = loadMap[a.id] || 0;
        const loadB = loadMap[b.id] || 0;
        if (loadA !== loadB) return loadA - loadB;
        return (lastAssignedMap[a.id] || 0) - (lastAssignedMap[b.id] || 0);
      });

      selectedPartnerId = partners[0].id;
    }

    if (!selectedPartnerId) {
      // Create default delivery partner if none exist
      const { data: newP } = await supabase
        .from('delivery_partners')
        .insert([{ name: 'QuickFix Fleet Partner', status: 'AVAILABLE' }])
        .select()
        .single();
      selectedPartnerId = newP?.id;
    }

    // Insert assignment record
    const { data: assignmentRecord } = await supabase
      .from('assignments')
      .insert([{
        order_id: orderId,
        delivery_partner_id: selectedPartnerId,
        role: 'delivery',
        status: 'active',
        assigned_at: new Date().toISOString()
      }])
      .select()
      .single();

    // Update order table
    await supabase
      .from('order_table')
      .update({
        delivery_partner_id: selectedPartnerId,
        assigned_partner_id: selectedPartnerId,
        assigned_at: new Date().toISOString(),
        order_status: 'assigned_to_delivery'
      })
      .eq('order_id', orderId);

    console.log(`[ASSIGNMENT] Order ${orderId} auto-assigned to delivery partner ${selectedPartnerId}`);
    return { delivery_partner_id: selectedPartnerId, assignment: assignmentRecord };

  } catch (err) {
    console.error('[ASSIGNMENT_ERROR] assignDeliveryPartner failed:', err);
    return { error: err.message };
  }
};
