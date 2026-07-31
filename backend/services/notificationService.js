// Notification service for handling in-app selection confirmation notifications

exports.createSelectionNotification = ({ option, originalItemName, replacementItemName, isAutoFallback = false }) => {
  let message = '';
  let type = 'info';

  if (isAutoFallback) {
    message = `Time expired — ${originalItemName} was automatically replaced with ${replacementItemName}.`;
    type = 'warning';
  } else if (option === 'self_pick' || option === 'custom_pick' || option === 'option_i') {
    message = `Your unavailable item ${originalItemName} has been replaced with ${replacementItemName}, as chosen by you.`;
    type = 'success';
  } else if (option === 'picker_pick' || option === 'accept_suggested' || option === 'option_ii') {
    message = `Your unavailable item ${originalItemName} has been replaced with ${replacementItemName}.`;
    type = 'success';
  } else if (option === 'skip' || option === 'option_iii') {
    message = `Your unavailable item ${originalItemName} has been skipped and removed from your order.`;
    type = 'info';
  } else {
    message = `Substitution decision processed for item ${originalItemName}.`;
  }

  const notificationObj = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    option,
    originalItemName,
    replacementItemName,
    isAutoFallback,
    message,
    type,
  };

  console.log(`[In-App Notification] ${message}`);
  return notificationObj;
};

exports.sendNotification = async (userId, message) => {
  console.log(`Notification to ${userId}: ${message}`);
  return { success: true };
};

