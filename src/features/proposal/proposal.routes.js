const express = require('express');
const router = express.Router();
const ProposalController = require('./proposal.controller');
const BalanceController = require('./balance.controller');

router.post('/generate', ProposalController.generate);
router.get('/settings', ProposalController.getSettings);
router.post('/settings', ProposalController.updateSetting);
router.get('/logs', ProposalController.getLogs);
router.get('/metrics', ProposalController.metrics);

// Balance Routes
router.get('/balance', BalanceController.getBalance);
router.post('/balance/deposit', BalanceController.addDeposit);
router.get('/balance/history', BalanceController.getHistory);

module.exports = router;
