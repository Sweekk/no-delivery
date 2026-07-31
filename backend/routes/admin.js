const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Routes for admin metrics (Ticket 8)
router.get('/metrics', adminController.getMetrics);
router.get('/flagged-stores', adminController.getFlaggedStores);

module.exports = router;
