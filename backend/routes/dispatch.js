const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');

// Routes for finalization and assignment (Ticket 7)
router.post('/finalize', dispatchController.finalizeOrder);
router.post('/assign', dispatchController.assignDriver);

module.exports = router;
