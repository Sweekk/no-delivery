const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Routes for admin metrics
router.get('/dashboard', requireAuth, requireRole('admin'), adminController.getDashboard);
router.get('/metrics', requireAuth, requireRole('admin'), adminController.getMetrics);
router.get('/metrics/substitution-rate', requireAuth, requireRole('admin'), adminController.getSubstitutionRateByStore);
router.get('/metrics/fulfillment-time', requireAuth, requireRole('admin'), adminController.getAverageFulfillmentTime);
router.get('/flagged-stores', requireAuth, requireRole('admin'), adminController.getFlaggedStores);

module.exports = router;
