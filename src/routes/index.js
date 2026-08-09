const express = require('express');
const router = express.Router();
const proposalRoutes = require('../features/proposal/proposal.routes');
const authRoutes = require('../features/auth/auth.routes');
const followupRoutes = require('../features/followup/followup.routes');

router.use('/proposals', proposalRoutes);
router.use('/auth', authRoutes);
router.use('/followup', followupRoutes);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
