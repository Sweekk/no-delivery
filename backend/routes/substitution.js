const express = require('express');
const router = express.Router();
const substitutionController = require('../controllers/substitutionController');

// Routes for timer and batching substitution logic
router.post('/request', substitutionController.requestSubstitution);
router.post('/respond', substitutionController.respondSubstitution);

module.exports = router;
