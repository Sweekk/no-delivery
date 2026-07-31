// Controller for Delivery Partner Operations (Orders, Issues, Profile, Geolocation)

// GET /api/delivery/orders
exports.getAssignedOrders = (req, res) => {
  // Returns empty array by default unless real orders are created by checkout
  res.json({
    orders: []
  });
};

// POST /api/delivery/issues
exports.reportIssue = (req, res) => {
  const { orderId, issueType, description, alternateSuggestion } = req.body;

  if (!orderId || !issueType) {
    return res.status(400).json({ error: 'orderId and issueType are required.' });
  }

  console.log(`[Issue Report Received] Order: ${orderId}, Type: ${issueType}`, {
    description,
    alternateSuggestion
  });

  res.json({
    success: true,
    message: `Issue reported successfully for Order #${orderId}`,
    reportId: `ISSUE-${Date.now()}`
  });
};

// GET /api/delivery/profile
exports.getProfile = (req, res) => {
  res.json({
    partner: {
      id: 'PARTNER-402',
      name: 'QuickFix Fleet Partner',
      email: 'partner@quickfixgrocery.com',
      zone: 'Central Metro Zone',
      rating: 4.9,
      phone: '+91 98765 43210'
    },
    history: []
  });
};

// POST /api/delivery/location
exports.updateLocation = (req, res) => {
  const { lat, lng } = req.body;
  res.json({ success: true, updatedLocation: { lat, lng } });
};
