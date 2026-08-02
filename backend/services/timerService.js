const supabase = require('../lib/supabaseClient');

const TIMER_TIMEOUT_SECONDS = 180; // 3 minutes

/**
 * Server-side authoritative expiry scanner.
 * Queries Supabase every 15 seconds for items marked 'unavailable' or 'awaiting_customer'
 * whose timestamp is older than 3 minutes (180s).
 * Respects substitution_preference per item:
 *   - ask_first (or null): auto-skip on timeout
 *   - auto_substitute: auto-substitute with proposed product
 *   - skip: auto-skip
 * Recalculates order total and checks for order completion.
 */
async function scanAndExpireItems() {
  try {
    const cutoffIso = new Date(Date.now() - TIMER_TIMEOUT_SECONDS * 1000).toISOString();

    // 1. Query pending substitutions older than 3 minutes
    const { data: expiredSubs, error: subsErr } = await supabase
      .from('substitutions')
      .select('id, order_item_id, created_at, proposed_product_id')
      .eq('status', 'pending')
      .lt('created_at', cutoffIso);

    if (expiredSubs && expiredSubs.length > 0) {
      console.log(`[SERVER_TIMER_EXPIRY] Found ${expiredSubs.length} expired substitution(s) in database to auto-resolve.`);

      for (const sub of expiredSubs) {
        // Mark substitution log timed_out
        await supabase
          .from('substitutions')
          .update({ status: 'timed_out' })
          .eq('id', sub.id);

        if (sub.order_item_id) {
          // Fetch order_item detail to get order_id and substitution preference
          const { data: itemData } = await supabase
            .from('item_table')
            .select('order_id, item_id, substitution_preference, sub_rules')
            .eq('list', sub.order_item_id)
            .single();

          // Determine timeout behavior based on preference
          // null / ask_first → skip (default safe behavior)
          // auto_substitute → substitute with proposed product
          // skip → skip
          const pref = itemData?.substitution_preference || itemData?.sub_rules || 'ask_first';
          let timeoutStatus = 'SKIPPED';
          let replacementId = null;

          if (pref === 'auto_substitute' || pref === 'auto') {
            // Auto-substitute: use proposed product if available
            if (sub.proposed_product_id) {
              timeoutStatus = 'SUBSTITUTED';
              replacementId = sub.proposed_product_id;
            } else {
              // No proposed product available, fall back to skip
              timeoutStatus = 'SKIPPED';
            }
          }
          // ask_first / skip / null → SKIPPED (already default)

          const updateFields = { status: timeoutStatus };
          if (replacementId) {
            updateFields.replacement_item_id = replacementId;
          }

          // Update item in item_table
          await supabase
            .from('item_table')
            .update(updateFields)
            .eq('list', sub.order_item_id);

          console.log(`[SERVER_TIMER_EXPIRY] Auto-${timeoutStatus === 'SUBSTITUTED' ? 'substituted' : 'skipped'} item ${sub.order_item_id} (pref: ${pref}) due to 3-min timeout.`);

          if (itemData && itemData.order_id) {
            // Recalculate order total amount
            const { data: remainingItems } = await supabase
              .from('item_table')
              .select('price, item_price, quantity, qty_requested, status')
              .eq('order_id', itemData.order_id);

            if (remainingItems) {
              const newTotal = remainingItems.reduce((sum, i) => {
                const st = String(i.status || '').toUpperCase();
                if (st === 'SKIPPED' || st === 'SKIPPED_TIMEOUT') return sum;
                const p = parseFloat(i.price || i.item_price) || 0;
                const q = parseInt(i.quantity || i.qty_requested, 10) || 1;
                return sum + (p * q);
              }, 0);

              await supabase
                .from('order_table')
                .update({ total_amount: Number(newTotal.toFixed(2)) })
                .eq('order_id', itemData.order_id);

              // Check if all items in order are now resolved
              const unresolved = remainingItems.filter(i => {
                const st = String(i.status || '').toLowerCase();
                return ['pending', 'unavailable', 'picker_choice_pending', 'awaiting_customer'].includes(st);
              });

              if (unresolved.length === 0) {
                console.log(`[SERVER_TIMER_EXPIRY] All items resolved for order ${itemData.order_id}. Advancing status to order_confirmed.`);
                await supabase
                  .from('order_table')
                  .update({
                    order_status: 'order_confirmed',
                    finalized_at: new Date().toISOString()
                  })
                  .eq('order_id', itemData.order_id);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[SERVER_TIMER_EXPIRY_ERROR]', err.message);
  }
}

let cronIntervalId = null;

exports.startServerTimerExpiryCron = (intervalMs = 15000) => {
  if (cronIntervalId) clearInterval(cronIntervalId);
  console.log(`[SERVER_TIMER_CRON] Started server-side 3-min timer expiry job (scanning every ${intervalMs / 1000}s)...`);
  scanAndExpireItems();
  cronIntervalId = setInterval(scanAndExpireItems, intervalMs);
};

exports.stopServerTimerExpiryCron = () => {
  if (cronIntervalId) clearInterval(cronIntervalId);
};
