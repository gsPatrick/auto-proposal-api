const express = require('express');
const router = express.Router();
const proposalRoutes = require('../features/proposal/proposal.routes');

router.use('/proposals', proposalRoutes);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
