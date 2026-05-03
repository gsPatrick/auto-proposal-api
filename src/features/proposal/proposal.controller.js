const ProposalService = require('./proposal.service');
const Setting = require('../../models/Setting');
const ProposalLog = require('../../models/ProposalLog');

class ProposalController {
  
  async generate(req, res) {
    try {
      const result = await ProposalService.generateProposal(req.body);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSettings(req, res) {
    try {
      const settings = await Setting.findAll();
      const settingsMap = {};
      settings.forEach(s => settingsMap[s.key] = s.value);
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateSetting(req, res) {
    try {
      const { key, value } = req.body;
      await Setting.upsert({ key, value });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getLogs(req, res) {
    try {
      const logs = await ProposalLog.findAll({ order: [['createdAt', 'DESC']], limit: 50 });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async metrics(req, res) {
    try {
      const metrics = await ProposalService.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ProposalController();
