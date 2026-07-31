const timerService = require('../services/timerService');
const notificationService = require('../services/notificationService');

exports.requestSubstitution = async (req, res) => {
  const { orderId, itemId, durationSeconds = 180 } = req.body;
  if (!orderId || !itemId) {
    return res.status(400).json({ error: 'Missing orderId or itemId' });
  }

  const timerInfo = timerService.startSubstitutionTimer(orderId, itemId, ({ orderId, itemId }) => {
    console.log(`[Timer Expired Callback] Order: ${orderId}, Item: ${itemId}`);
  }, durationSeconds);

  return res.status(200).json({
    success: true,
    message: 'Substitution timer started',
    timerInfo,
  });
};

exports.getTimerStatus = async (req, res) => {
  const { itemId } = req.params;
  const timerInfo = timerService.getTimerInfo(itemId);
  if (!timerInfo) {
    return res.status(404).json({ success: false, remainingSeconds: 0 });
  }
  return res.status(200).json({ success: true, timerInfo });
};

exports.respondSubstitution = async (req, res) => {
  const { orderId, itemId, option, originalItemName, replacementItemName, isAutoFallback } = req.body;
  if (!orderId || !itemId || !option) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Clear running timer once responded
  timerService.clearSubstitutionTimer(itemId);

  const notification = notificationService.createSelectionNotification({
    option,
    originalItemName: originalItemName || 'Item',
    replacementItemName: replacementItemName || 'Substitute Item',
    isAutoFallback: !!isAutoFallback,
  });

  return res.status(200).json({
    success: true,
    message: 'Substitution response recorded',
    notification,
  });
};

exports.finalizePickerPick = async (req, res) => {
  const { orderId, itemId, originalItemName, chosenReplacementName } = req.body;
  
  timerService.clearSubstitutionTimer(itemId);

  const notification = notificationService.createSelectionNotification({
    option: 'picker_pick',
    originalItemName: originalItemName || 'Item',
    replacementItemName: chosenReplacementName || 'Substitute Item',
    isAutoFallback: false,
  });

  return res.status(200).json({
    success: true,
    message: 'Picker replacement finalized',
    notification,
  });
};

