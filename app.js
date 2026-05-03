const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./src/config/database');
const routes = require('./src/routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Database Sync & Server Start
const PORT = process.env.PORT || 3000;

const AuthController = require('./src/features/auth/auth.controller');

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao Postgres com sucesso!');

    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados.');
    } catch (syncError) {
      if (syncError.message.includes('cannot be cast automatically to type uuid')) {
        console.log('⚠️ Detectado conflito de tipo UUID. Resetando tabela balance_transactions...');
        await sequelize.query('DROP TABLE IF EXISTS "balance_transactions" CASCADE;');
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados após reset.');
      } else {
        throw syncError;
      }
    }

    // Cria usuário padrão se não existir
    await AuthController.seedAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
  }
}

startServer();
