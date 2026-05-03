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

    // --- FORÇAR HISTÓRICO E SALDO REAL (REQUISIÇÃO DO USUÁRIO) ---
    const BalanceTransaction = require('./src/models/BalanceTransaction');
    const Setting = require('./src/models/Setting');

    try {
      const admin = (await AuthController.listUsers({ body: {} }, { json: () => {} }))?.[0] || { id: null, name: 'Patrick Siqueira' };
      const userId = admin.id;
      const userName = admin.name;

      console.log('🔍 Verificando integridade da carteira...');

      // 1. Garante o Depósito de $10
      const [deposit, createdDep] = await BalanceTransaction.findOrCreate({
        where: { type: 'deposit', amount: 10.00, provider: 'openai' },
        defaults: {
          previousBalance: 0,
          newBalance: 10.00,
          description: 'Depósito Inicial (OpenAI)',
          userId,
          userName
        }
      });
      if (createdDep) console.log('✅ Depósito de $10 criado.');

      // 2. Garante o Gasto de $0.0446
      const [usage, createdUsage] = await BalanceTransaction.findOrCreate({
        where: { type: 'usage', amount: 0.0446, provider: 'openai' },
        defaults: {
          previousBalance: 10.00,
          newBalance: 9.9554,
          description: 'Disparo Realizado',
          userId,
          userName
        }
      });
      if (createdUsage) console.log('✅ Gasto de $0.0446 registrado.');

      // 3. Força Saldo Final
      await Setting.upsert({ key: 'balance_openai', value: '9.9554' });
      console.log('✅ Saldo OpenAI fixado em $9.9554');

    } catch (err) {
      console.error('❌ Erro ao sincronizar carteira:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
  }
}

startServer();
