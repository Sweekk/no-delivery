const supabase = require('../lib/supabaseClient');

const SUBSTITUTION_RATE_FLAG_THRESHOLD = 25; // 25% threshold for flagging high substitution rate stores

/**
 * GET /api/admin/dashboard
 * Consolidated dashboard metrics endpoint
 */
exports.getDashboard = async (req, res) => {
  const invoke = (handler) => new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) {
        if (this.statusCode >= 400) reject(new Error(body.details || body.error || 'Dashboard request failed'));
        else resolve(body);
      },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });

  try {
    const [metrics, substitution, fulfillment] = await Promise.all([
      invoke(exports.getMetrics),
      invoke(exports.getSubstitutionRateByStore),
      invoke(exports.getAverageFulfillmentTime),
    ]);

    const storeList = substitution?.stores || [];
    const substitutionAverage = storeList.length
      ? storeList.reduce((total, store) => total + Number(store.substitution_rate || 0), 0) / storeList.length
      : 0;

    const slaScore = Math.max(0, 100 - Math.max(0, Number(fulfillment.overall_average_minutes || 0) - 10) * 5);
    const substitutionScore = Math.max(0, 100 - substitutionAverage * 2);
    const health_score = Math.round((slaScore * 0.55) + (substitutionScore * 0.45));
    const flagged = storeList.filter((store) => store.flagged).length;
    const label = health_score >= 80 ? 'Healthy network' : health_score >= 60 ? 'Needs attention' : 'Action required';
    const summary = flagged
      ? `${flagged} store${flagged === 1 ? '' : 's'} need substitution review.`
      : `Fulfillment is averaging ${Number(fulfillment.overall_average_minutes || 0).toFixed(1)} minutes.`;

    return res.status(200).json({
      metrics,
      substitution,
      fulfillment,
      performance: {
        health_score,
        label,
        summary,
        flagged_stores: flagged,
        average_substitution_rate: Number(substitutionAverage.toFixed(1)),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
};

/**
 * GET /api/admin/metrics
 */
exports.getMetrics = async (req, res) => {
  try {
    const { data: orders, error: ordersErr } = await supabase
      .from('order_table')
      .select('order_id, order_status, order_date, total_amount, store_id, stores(name)')
      .order('order_date', { ascending: false });

    if (ordersErr) {
      throw new Error(`Failed to query order_table: ${ordersErr.message}`);
    }

    const allOrders = orders || [];
    const total_orders = allOrders.length;

    // Revenue only counts confirmed+ orders (order_confirmed, assigned_to_delivery, out_for_delivery, delivered, FINALIZED)
    const confirmedOrders = allOrders.filter(o => {
      const st = String(o.order_status).toLowerCase();
      return ['order_confirmed', 'assigned_to_delivery', 'out_for_delivery', 'delivered', 'finalized'].includes(st);
    });

    const total_revenue = confirmedOrders.reduce((sum, o) => {
      const amt = parseFloat(o.total_amount) || 0;
      return sum + amt;
    }, 0);

    const average_order_value = confirmedOrders.length > 0
      ? Number((total_revenue / confirmedOrders.length).toFixed(2))
      : 0;

    const status_breakdown = {
      placed: 0,
      assigned_to_picker: 0,
      picking_in_progress: 0,
      picking_complete: 0,
      order_confirmed: 0,
      assigned_to_delivery: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      PENDING: 0,
      PICKING: 0,
      AWAITING_SUBSTITUTION: 0,
      FINALIZED: 0,
      ASSIGNED: 0,
      DELIVERED: 0
    };

    allOrders.forEach((o) => {
      const st = (o.order_status || 'placed').toLowerCase();
      if (status_breakdown[st] !== undefined) {
        status_breakdown[st] += 1;
      } else {
        const uppercaseSt = st.toUpperCase();
        if (status_breakdown[uppercaseSt] !== undefined) {
          status_breakdown[uppercaseSt] += 1;
        } else {
          status_breakdown[st] = 1;
        }
      }
    });

    // Query item substitution / skip / timeout statistics from item_table
    const { data: itemStats } = await supabase
      .from('item_table')
      .select('status, sub_rules');

    let totalItems = 0;
    let substitutedCount = 0;
    let skippedCount = 0;
    let timeoutCount = 0;

    (itemStats || []).forEach(i => {
      totalItems += 1;
      const st = String(i.status || '').toUpperCase();
      if (st === 'SUBSTITUTED') substitutedCount += 1;
      if (st === 'SKIPPED' || st === 'SKIPPED_TIMEOUT') skippedCount += 1;
    });

    // Count timed-out substitutions from the substitutions table
    const { data: timedOutSubs } = await supabase
      .from('substitutions')
      .select('id')
      .eq('status', 'timed_out');
    timeoutCount = (timedOutSubs || []).length;

    const substitution_rate = totalItems > 0
      ? Number((((substitutedCount + skippedCount) / totalItems) * 100).toFixed(1))
      : 0;

    // Query worker load from assignments table
    const { data: activeAssignments } = await supabase
      .from('assignments')
      .select('picker_id, delivery_partner_id, role')
      .eq('status', 'active');

    const activePickersCount = new Set((activeAssignments || []).filter(a => a.role === 'picker' && a.picker_id).map(a => a.picker_id)).size;
    const activeDriversCount = new Set((activeAssignments || []).filter(a => a.role === 'delivery' && a.delivery_partner_id).map(a => a.delivery_partner_id)).size;

    const { count: storesCount } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });

    const recent_orders = allOrders.slice(0, 10).map((o) => ({
      order_id: o.order_id,
      store_name: o.stores?.name || 'Store Hub',
      order_status: o.order_status,
      total_amount: parseFloat(o.total_amount) || 0,
      order_date: o.order_date,
    }));

    return res.status(200).json({
      total_orders,
      total_revenue: Number(total_revenue.toFixed(2)),
      average_order_value,
      active_stores: storesCount || 0,
      active_pickers: activePickersCount,
      active_delivery_partners: activeDriversCount,
      substitution_analytics: {
        total_items: totalItems,
        substituted_count: substitutedCount,
        skipped_count: skippedCount,
        timeout_count: timeoutCount,
        substitution_rate
      },
      status_breakdown,
      recent_orders,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch admin metrics',
      details: error.message,
    });
  }
};

/**
 * GET /api/admin/flagged-stores
 * Dynamic Supabase query for stores exceeding substitution threshold
 */
exports.getFlaggedStores = async (req, res) => {
  try {
    const { data: stores, error: storesErr } = await supabase.from('stores').select('id, name, location');
    if (storesErr || !stores) {
      return res.status(200).json({ flag_threshold: SUBSTITUTION_RATE_FLAG_THRESHOLD, flagged_stores: [] });
    }

    const { data: orders } = await supabase.from('order_table').select('order_id, store_id');
    const { data: orderItems } = await supabase.from('item_table').select('order_id, status, resolution_status');

    const substitutedOrderIds = new Set();
    (orderItems || []).forEach((item) => {
      const resStatus = (item.resolution_status || '').toUpperCase();
      if (resStatus === 'SUBSTITUTED' || resStatus === 'SKIPPED') {
        substitutedOrderIds.add(item.order_id);
      }
    });

    const flaggedStores = stores.map((store) => {
      const storeOrders = (orders || []).filter((o) => o.store_id === store.id);
      const total_orders = storeOrders.length;
      const orders_with_substitution = storeOrders.filter((o) => substitutedOrderIds.has(o.order_id)).length;
      const substitution_rate = total_orders > 0
        ? Number(((orders_with_substitution / total_orders) * 100).toFixed(1))
        : 0;

      return {
        store_id: store.id,
        store_name: store.name,
        location: store.location || 'Central Dark Store',
        total_orders,
        orders_with_substitution,
        substitution_rate,
        flagged: substitution_rate >= SUBSTITUTION_RATE_FLAG_THRESHOLD,
      };
    }).filter((s) => s.flagged);

    return res.status(200).json({
      flag_threshold: SUBSTITUTION_RATE_FLAG_THRESHOLD,
      flagged_count: flaggedStores.length,
      flagged_stores: flaggedStores,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch flagged stores', details: error.message });
  }
};

/**
 * GET /api/admin/metrics/substitution-rate
 */
exports.getSubstitutionRateByStore = async (req, res) => {
  try {
    const { data: viewData, error: viewError } = await supabase
      .from('store_substitution_rates')
      .select('*');

    if (!viewError && viewData && viewData.length > 0) {
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

    const { data: stores, error: storesErr } = await supabase.from('stores').select('id, name');
    if (storesErr || !stores) {
      return res.status(200).json({ flag_threshold: SUBSTITUTION_RATE_FLAG_THRESHOLD, stores: [] });
    }

    const { data: orders } = await supabase.from('order_table').select('order_id, store_id');
    const { data: orderItems } = await supabase.from('item_table').select('order_id, status, resolution_status');

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
      const orders_with_substitution = storeOrders.filter((o) => substitutedOrderIds.has(o.order_id)).length;

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
 */
exports.getAverageFulfillmentTime = async (req, res) => {
  try {
    const { data: viewData, error: viewError } = await supabase
      .from('store_fulfillment_times')
      .select('*');

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
        const start = new Date(o.order_date).getTime();
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
