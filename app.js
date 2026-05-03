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
    const [admin] = await AuthController.seedAdmin();

    const BalanceTransaction = require('./src/models/BalanceTransaction');
    const ProposalLog = require('./src/models/ProposalLog');
    const Setting = require('./src/models/Setting');

    // --- TEMPORARY CLEANUP (Remove simulated usage) ---
    await BalanceTransaction.destroy({ where: { type: 'usage', description: 'Disparo OpenAI (gpt-4o)' } });
    await ProposalLog.destroy({ where: { platform: 'Upwork', model: 'gpt-4o' } });

    const historyCount = await BalanceTransaction.count();
    if (historyCount === 0) {
      console.log('🌱 Gerando depósito inicial de $10...');
      
      const userId = admin ? admin.id : null;
      const userName = admin ? admin.name : 'Patrick Siqueira';

      // 1. Depósito de $10
      await BalanceTransaction.create({
        type: 'deposit',
        provider: 'openai',
        amount: 10.00,
        previousBalance: 0,
        newBalance: 10.00,
        description: 'Depósito Inicial (OpenAI)',
        userId,
        userName
      });

      // 2. Atualiza Saldo Global para 10.00 exatos
      await Setting.upsert({ key: 'balance_openai', value: '10.00' });
      
      console.log('✅ Depósito inicial gerado.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
  }
}

startServer();
