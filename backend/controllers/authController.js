// Controller for Delivery Partner Authentication

exports.deliveryLogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Simulated auth check — replace with DB / JWT logic when DB model is attached
  if (email.includes('error')) {
    return res.status(401).json({ error: 'Invalid delivery partner credentials.' });
  }

  return res.json({
    success: true,
    message: 'Delivery partner authenticated successfully.',
    partner: {
      id: 'PARTNER-402',
      email: email,
      name: 'QuickFix Delivery Partner',
      zone: 'Central Metro Zone',
      rating: 4.9,
      token: 'jwt-simulated-token-402'
    }
  });
};
