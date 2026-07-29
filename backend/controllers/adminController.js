const supabase = require('../lib/supabaseClient');
const SUBSTITUTION_RATE_FLAG_THRESHOLD = 25; // 25% chosen as a starting point – higher rates likely indicate stock sync issues

exports.getMetrics = async (req, res) => {
  res.status(200).json({ message: 'Admin metrics placeholder' });
};

exports.getFlaggedStores = async (req, res) => {
  res.status(200).json({ message: 'Flagged stores placeholder' });
};

/**
 * GET /api/admin/metrics/substitution-rate
 * 
 * Returns the percentage of orders per store that had at least one substitution or skip event.
 * Handles edge case where a store has 0 orders (returns substitution_rate: 0 instead of NaN/null).
 */
exports.getSubstitutionRateByStore = async (req, res) => {
  try {
    // 1. Attempt querying PostgreSQL view `store_substitution_rates`
    const { data: viewData, error: viewError } = await supabase
      .from('store_substitution_rates')
      .select('*');

    if (!viewError && viewData) {
      const formatted = viewData.map((item) => {
        const total = Number(item.total_orders || 0);
        const subCount = Number(item.orders_with_substitution || 0);
        const rate = total > 0 ? Number(Number(item.substitution_rate || 0).toFixed(1)) : 0;
        return {
          store_id: item.store_id,
          store_name: item.store_name,
          total_orders: total,
          orders_with_substitution: subCount,
          substitution_rate: rate,
          flagged: rate >= SUBSTITUTION_RATE_FLAG_THRESHOLD,
        };
      });
      return res.status(200).json({ flag_threshold: SUBSTITUTION_RATE_FLAG_THRESHOLD, stores: formatted });
    }

    // 2. Fallback JS aggregation if DB view is missing or inaccessible
    const { data: stores, error: storesErr } = await supabase.from('stores').select('id, name');
    if (storesErr || !stores) {
      return res.status(200).json([]);
    }

    // Fallback using the correct tables
    const { data: orders } = await supabase.from('order_table').select('order_id, store_id');
    const { data: orderItems } = await supabase.from('item_table').select('order_id, status');

    // Collect order IDs that contain substitution or skip events
    const substitutedOrderIds = new Set();
    (orderItems || []).forEach((item) => {
      const resStatus = (item.resolution_status || '').toUpperCase();
      if (resStatus === 'SUBSTITUTED' || resStatus === 'SKIPPED') {
        substitutedOrderIds.add(item.order_id);
      }
    });

    const metrics = stores.map((store) => {
      const storeOrders = (orders || []).filter((o) => o.store_id === store.id);
      const total_orders = storeOrders.length;
      const orders_with_substitution = storeOrders.filter((o) => substitutedOrderIds.has(o.id)).length;

      const substitution_rate = total_orders > 0
        ? Number(((orders_with_substitution / total_orders) * 100).toFixed(1))
        : 0;

      return {
        store_id: store.id,
        store_name: store.name,
        total_orders,
        orders_with_substitution,
        substitution_rate,
        flagged: substitution_rate >= SUBSTITUTION_RATE_FLAG_THRESHOLD,
      };
    });

    return res.status(200).json({ flag_threshold: SUBSTITUTION_RATE_FLAG_THRESHOLD, stores: metrics });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to calculate substitution rate per store',
      details: error.message,
    });
  }
};

/**
 * GET /api/admin/metrics/fulfillment-time
 * 
 * Returns overall average fulfillment time (in minutes) and per-store breakdown.
 * Filters out orders where finalized_at IS NULL.
 * Excludes stores with 0 finalized orders from per_store list.
 */
exports.getAverageFulfillmentTime = async (req, res) => {
  try {
    // 1. Attempt querying PostgreSQL view `store_fulfillment_times`
    const { data: viewData, error: viewError } = await supabase
      .from('store_fulfillment_times')
      .select('*');

    // 2. Query finalized orders to compute overall average & JS fallback if needed
    // Query the correct table (order_table) and use the proper column names
    const { data: orders, error: ordersError } = await supabase
      .from('order_table')
      .select('order_id, store_id, order_date, finalized_at')
      .not('finalized_at', 'is', null);

    if (ordersError) {
      return res.status(500).json({
        error: 'Failed to fetch finalized orders',
        details: ordersError.message,
      });
    }

    const validOrders = (orders || []).filter((o) => o.finalized_at);

    let overallAverageMinutes = 0;
    if (validOrders.length > 0) {
      const totalMinutes = validOrders.reduce((sum, o) => {
        const start = new Date(o.order_date).getTime();
        const end = new Date(o.finalized_at).getTime();
        const diffMinutes = Math.max(0, (end - start) / (1000 * 60));
        return sum + diffMinutes;
      }, 0);
      overallAverageMinutes = Number((totalMinutes / validOrders.length).toFixed(1));
    }

    // If SQL view worked, build per_store list from view; otherwise fallback JS calculation
    let perStore = [];

    if (!viewError && viewData && viewData.length > 0) {
      perStore = viewData.map((item) => ({
        store_id: item.store_id,
        store_name: item.store_name,
        average_minutes: Number(Number(item.average_minutes || 0).toFixed(1)),
        order_count: Number(item.order_count || 0),
      })).filter((item) => item.order_count > 0);
    } else {
      const { data: stores } = await supabase.from('stores').select('id, name');
      const storeMap = new Map((stores || []).map((s) => [s.id, s.name]));

      const storeMetricsMap = new Map();

      validOrders.forEach((o) => {
        if (!o.store_id) return;
        const start = new Date(o.placed_at || o.created_at).getTime();
        const end = new Date(o.finalized_at).getTime();
        const diffMinutes = Math.max(0, (end - start) / (1000 * 60));

        if (!storeMetricsMap.has(o.store_id)) {
          storeMetricsMap.set(o.store_id, { totalMinutes: 0, count: 0 });
        }
        const current = storeMetricsMap.get(o.store_id);
        current.totalMinutes += diffMinutes;
        current.count += 1;
      });

      storeMetricsMap.forEach((metrics, storeId) => {
        if (metrics.count > 0) {
          perStore.push({
            store_id: storeId,
            store_name: storeMap.get(storeId) || 'Unknown Store',
            average_minutes: Number((metrics.totalMinutes / metrics.count).toFixed(1)),
            order_count: metrics.count,
          });
        }
      });
    }

    // If overall average is still 0, compute it from the per-store data (weighted average)
    if (overallAverageMinutes === 0 && perStore.length > 0) {
      const totalOrders = perStore.reduce((sum, s) => sum + (s.order_count || 0), 0);
      const weightedSum = perStore.reduce((sum, s) => sum + ((s.average_minutes || 0) * (s.order_count || 0)), 0);
      overallAverageMinutes = totalOrders > 0 ? Number((weightedSum / totalOrders).toFixed(1)) : 0;
    }

    return res.status(200).json({
      overall_average_minutes: overallAverageMinutes,
      per_store: perStore,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to calculate average fulfillment time',
      details: error.message,
    });
  }
};


