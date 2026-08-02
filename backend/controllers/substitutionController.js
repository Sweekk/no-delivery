const timerService = require('../services/timerService');
const notificationService = require('../services/notificationService');
const substitutionService = require('../services/substitutionService');

exports.requestSubstitution = async (req, res) => {
  const { orderId, itemId, durationSeconds = 180 } = req.body;
  if (!orderId || !itemId) {
    return res.status(400).json({ error: 'Missing orderId or itemId' });
  }

  const timerInfo = timerService.startSubstitutionTimer ? timerService.startSubstitutionTimer(orderId, itemId, ({ orderId, itemId }) => {
    console.log(`[Timer Expired Callback] Order: ${orderId}, Item: ${itemId}`);
  }, durationSeconds) : { remainingSeconds: durationSeconds };

  return res.status(200).json({
    success: true,
    message: 'Substitution timer started',
    timerInfo,
  });
};

exports.getTimerStatus = async (req, res) => {
  const { itemId } = req.params;
  const timerInfo = timerService.getTimerInfo ? timerService.getTimerInfo(itemId) : null;
  if (!timerInfo) {
    return res.status(200).json({ success: true, remainingSeconds: 180 });
  }
  return res.status(200).json({ success: true, timerInfo });
};

exports.respondSubstitution = async (req, res) => {
  const { orderId, itemId, option, originalItemName, replacementItemName, isAutoFallback } = req.body;
  if (!orderId || !itemId || !option) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (timerService.clearSubstitutionTimer) {
    timerService.clearSubstitutionTimer(itemId);
  }

  const notification = notificationService.createSelectionNotification ? notificationService.createSelectionNotification({
    option,
    originalItemName: originalItemName || 'Item',
    replacementItemName: replacementItemName || 'Substitute Item',
    isAutoFallback: !!isAutoFallback,
  }) : null;

  return res.status(200).json({
    success: true,
    message: 'Substitution response recorded',
    notification,
  });
};

exports.finalizePickerPick = async (req, res) => {
  const { orderId, itemId, originalItemName, chosenReplacementName } = req.body;
  
  if (timerService.clearSubstitutionTimer) {
    timerService.clearSubstitutionTimer(itemId);
  }

  const notification = notificationService.createSelectionNotification ? notificationService.createSelectionNotification({
    option: 'picker_pick',
    originalItemName: originalItemName || 'Item',
    replacementItemName: chosenReplacementName || 'Substitute Item',
    isAutoFallback: false,
  }) : null;

  return res.status(200).json({
    success: true,
    message: 'Picker replacement finalized',
    notification,
  });
};

/**
 * GET /api/substitution/suggested/:itemId
 * Returns same-category suggested substitute item
 */
exports.getSuggestedSubstitute = async (req, res) => {
  const { itemId } = req.params;
  const { category } = req.query;

  try {
    const substitute = await substitutionService.findSubstituteProduct(itemId, category);
    return res.status(200).json({
      success: true,
      suggested_substitute: substitute
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/substitution/batch-respond
 * Handles batch substitution decisions for an order
 */
exports.handleBatchDecisions = async (req, res) => {
  const { orderId, decisions } = req.body;

  if (!orderId || !Array.isArray(decisions)) {
    return res.status(400).json({ success: false, error: 'orderId and array of decisions are required' });
  }

  try {
    const results = await substitutionService.processBatchSubstitutionDecisions(orderId, decisions);
    return res.status(200).json({
      success: true,
      message: 'Batch substitution decisions recorded successfully',
      results
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
