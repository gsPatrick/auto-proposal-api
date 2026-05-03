const Setting = require('../../models/Setting');
const BalanceTransaction = require('../../models/BalanceTransaction');

class BalanceController {
  
  async getBalance(req, res) {
    try {
      const providers = ['openai', 'claude', 'google', 'groq'];
      const balances = {};
      
      for (const p of providers) {
        const setting = await Setting.findByPk(`balance_${p}`);
        balances[p] = setting ? parseFloat(setting.value) : 0;
      }
      
      res.json(balances);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addDeposit(req, res) {
    try {
      const { amount, description, userId, userName, provider } = req.body;
      if (!provider) return res.status(400).json({ success: false, error: 'Provedor é obrigatório' });

      const numAmount = parseFloat(amount);
      const balanceKey = `balance_${provider}`;
      
      const currentBalanceSetting = await Setting.findByPk(balanceKey);
      const currentBalance = currentBalanceSetting ? parseFloat(currentBalanceSetting.value) : 0;
      const newBalance = currentBalance + numAmount;

      if (!currentBalanceSetting) {
        await Setting.create({ key: balanceKey, value: newBalance });
      } else {
        await currentBalanceSetting.update({ value: newBalance });
      }

      // Registra transação
      await BalanceTransaction.create({
        type: 'deposit',
        provider: provider,
        amount: numAmount,
        previousBalance: currentBalance,
        newBalance: newBalance,
        description: description || `Depósito Manual (${provider})`,
        userId,
        userName
      });

      res.json({ success: true, newBalance });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getHistory(req, res) {
    try {
      const history = await BalanceTransaction.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100
      });
      console.log(`[DB] Encontradas ${history.length} transações no histórico.`);
      res.json(history);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new BalanceController();
