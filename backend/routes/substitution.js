const express = require('express');
const router = express.Router();
const substitutionController = require('../controllers/substitutionController');

// Routes for timer and batching substitution logic
router.post('/request', substitutionController.requestSubstitution);
router.get('/timer-status/:itemId', substitutionController.getTimerStatus);
router.post('/respond', substitutionController.respondSubstitution);
router.post('/finalize-picker-pick', substitutionController.finalizePickerPick);

// Additional endpoints
router.get('/suggested/:itemId', substitutionController.getSuggestedSubstitute);
router.post('/batch-respond', substitutionController.handleBatchDecisions);

module.exports = router;
