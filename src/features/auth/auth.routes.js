const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');

router.post('/login', AuthController.login);
router.post('/update', AuthController.updateProfile);
router.get('/users', AuthController.listUsers);
router.get('/users/metrics', AuthController.getUserMetrics);

module.exports = router;
