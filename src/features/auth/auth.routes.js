const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');

router.post('/login', AuthController.login);
router.post('/update', AuthController.updateProfile);

module.exports = router;
