const express = require('express');
const router = express.Router();
const proposalRoutes = require('../features/proposal/proposal.routes');
const authRoutes = require('../features/auth/auth.routes');

router.use('/proposals', proposalRoutes);
router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
