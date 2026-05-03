const User = require('../../models/User');

class AuthController {
  
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
      const count = await User.count();
      if (count === 0) {
        await User.create({
          email: 'patricksiqueira.developer@gmail.com',
          password: 'patrick123',
          name: 'Patrick Siqueira'
        });
        console.log('✅ Usuário admin padrão criado.');
      }
    } catch (error) {
      console.error('❌ Erro ao criar admin padrão:', error);
    }
  }
}

module.exports = new AuthController();
