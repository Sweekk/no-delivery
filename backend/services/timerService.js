// Service for handling 3-minute (180s) countdown timer logic for per-item substitutions
const activeTimers = new Map(); // Key: itemId, Value: { orderId, itemId, startedAt, durationSeconds: 180, timerId }

const DEFAULT_TIMER_DURATION_SECONDS = 180; // 3 minutes

exports.startSubstitutionTimer = (orderId, itemId, onExpireCallback, durationSeconds = DEFAULT_TIMER_DURATION_SECONDS) => {
  console.log(`Starting ${durationSeconds}s timer for order ${orderId}, item ${itemId}`);
  
  // Clear any existing timer for this item
  if (activeTimers.has(itemId)) {
    clearTimeout(activeTimers.get(itemId).timerId);
  }

  const startedAt = Date.now();
  const expiresAt = startedAt + durationSeconds * 1000;

  const timerId = setTimeout(() => {
    console.log(`Timer expired for item ${itemId} in order ${orderId}. Triggering default Option ii fallback.`);
    activeTimers.delete(itemId);
    if (typeof onExpireCallback === 'function') {
      onExpireCallback({ orderId, itemId, status: 'expired' });
    }
  }, durationSeconds * 1000);

  const timerInfo = {
    orderId,
    itemId,
    startedAt,
    expiresAt,
    durationSeconds,
    timerId,
  };

  activeTimers.set(itemId, timerInfo);
  return timerInfo;
};

exports.getRemainingTimeSeconds = (itemId) => {
  if (!activeTimers.has(itemId)) return 0;
  const info = activeTimers.get(itemId);
  const remaining = Math.max(0, Math.ceil((info.expiresAt - Date.now()) / 1000));
  return remaining;
};

exports.clearSubstitutionTimer = (itemId) => {
  if (activeTimers.has(itemId)) {
    clearTimeout(activeTimers.get(itemId).timerId);
    activeTimers.delete(itemId);
    console.log(`Cleared timer for item ${itemId}`);
  }
};

exports.getTimerInfo = (itemId) => {
  if (!activeTimers.has(itemId)) return null;
  const info = activeTimers.get(itemId);
  return {
    orderId: info.orderId,
    itemId: info.itemId,
    startedAt: info.startedAt,
    expiresAt: info.expiresAt,
    remainingSeconds: exports.getRemainingTimeSeconds(itemId),
  };
};

