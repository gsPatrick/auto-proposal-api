const express = require('express');
const router = express.Router();
const ProposalController = require('./proposal.controller');

router.post('/generate', ProposalController.generate);
router.get('/settings', ProposalController.getSettings);
router.post('/settings', ProposalController.updateSetting);
router.get('/logs', ProposalController.getLogs);
router.get('/metrics', ProposalController.metrics);

module.exports = router;
