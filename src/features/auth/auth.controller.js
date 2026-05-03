const User = require('../../models/User');
const ProposalLog = require('../../models/ProposalLog');
const Setting = require('../../models/Setting');
const { Op } = require('sequelize');

class AuthController {
  
  async listUsers(req, res) {
    try {
      const users = await User.findAll({ 
        where: {
          email: { [Op.ne]: 'patricksiqueira.developer@gmail.com' }
        },
        attributes: ['id', 'name', 'email'] 
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserMetrics(req, res) {
    try {
      const users = await User.findAll({
        where: {
          email: { [Op.ne]: 'patricksiqueira.developer@gmail.com' }
        },
        attributes: ['id', 'name', 'email']
      });

      const metrics = await Promise.all(users.map(async (user) => {
        const logs = await ProposalLog.findAll({ where: { userId: user.id } });
        
        const totalSpent = logs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);
        const proposalCount = logs.length;
        
        // Calcular Top Model
        const models = logs.map(l => l.model);
        const topModel = models.sort((a,b) =>
            models.filter(v => v===a).length - models.filter(v => v===b).length
        ).pop() || 'N/A';

        // Calcular Top Platform
        const platforms = logs.map(l => l.platform);
        const topPlatform = platforms.sort((a,b) =>
            platforms.filter(v => v===a).length - platforms.filter(v => v===b).length
        ).pop() || 'N/A';

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          totalSpent,
          proposalCount,
          topModel,
          topPlatform
        };
      }));

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Busca usuário
      const user = await User.findOne({ where: { email } });
      
      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
      }

      res.json({ 
        success: true, 
        user: { id: user.id, name: user.name, email: user.email } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { id, email, password, name } = req.body;
      const user = await User.findByPk(id);
      
      if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

      await user.update({ email, password, name });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Método para garantir que o usuário padrão exista
  async seedAdmin() {
    try {
      // Seed Usuários
      const users = [
        { email: 'patrick@gmail.com', password: 'patrick123', name: 'Patrick Siqueira' },
        { email: 'beatrizmello@gmail.com', password: 'beatrizmello123', name: 'Beatriz Nascimento' },
        { email: 'patricksiqueira.developer@gmail.com', password: 'patrick123', name: 'Patrick Siqueira' }
      ];

      const createdUsers = [];
      for (const userData of users) {
        const [user] = await User.findOrCreate({
          where: { email: userData.email },
          defaults: userData
        });
        createdUsers.push(user);
      }
      
      // ... (saldo logic) ...
      return createdUsers;

      // Seed Saldo Inicial Inteligente (OpenAI)
      const openaiBalanceKey = 'balance_openai';
      const existingBalance = await Setting.findByPk(openaiBalanceKey);

      if (!existingBalance) {
        // Busca todos os gastos da OpenAI já registrados
        const totalSpent = await ProposalLog.sum('cost', { where: { provider: 'openai' } }) || 0;
        const initialCredit = 10.00;
        const finalBalance = initialCredit - totalSpent;

        await Setting.create({
          key: openaiBalanceKey,
          value: finalBalance.toString()
        });
        
        console.log(`[Finance] Saldo inicial OpenAI configurado: $${finalBalance} (Gasto detectado: $${totalSpent})`);
      }

    } catch (error) {
      console.error('Erro no seedAdmin:', error);
    }
  }
}

module.exports = new AuthController();
