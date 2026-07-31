const express = require('express');
const router = express.Router();
const { signup, login, deliveryLogin } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/delivery-login', deliveryLogin);

module.exports = router;
