const express = require('express');
const router = express.Router();
const pickerController = require('../controllers/pickerController');

// Routes for picker actions
router.get('/active-run', pickerController.getActiveRun);
router.post('/item-not-found', pickerController.handleNotFound);

module.exports = router;
