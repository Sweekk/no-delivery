// Stubbed notifications service
exports.sendNotification = async (userId, message) => {
  console.log(`Notification to ${userId}: ${message}`);
  return { success: true };
};
