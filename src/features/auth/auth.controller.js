const User = require('../../models/User');
const ProposalLog = require('../../models/ProposalLog');
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
      const users = [
        { email: 'patrick@gmail.com', password: 'patrick123', name: 'Patrick Siqueira' },
        { email: 'beatrizmello@gmail.com', password: 'beatrizmello123', name: 'Beatriz Nascimento' },
        { email: 'patricksiqueira.developer@gmail.com', password: 'patrick123', name: 'Patrick Siqueira' }
      ];

      for (const userData of users) {
        await User.findOrCreate({
          where: { email: userData.email },
          defaults: userData
        });
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar usuários:', error);
    }
  }
}

module.exports = new AuthController();
