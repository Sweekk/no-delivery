const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Routes for admin metrics
router.get('/metrics', adminController.getMetrics);
router.get('/metrics/substitution-rate', adminController.getSubstitutionRateByStore);
router.get('/metrics/fulfillment-time', adminController.getAverageFulfillmentTime);
router.get('/flagged-stores', adminController.getFlaggedStores);

module.exports = router;
