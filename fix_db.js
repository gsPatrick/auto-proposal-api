const sequelize = require('./src/config/database');

async function fixDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco para manutenção.');

    // Drop table balance_transactions to fix the UUID type mismatch
    // Since history is empty (0 records), this is safe and effective
    await sequelize.query('DROP TABLE IF EXISTS "balance_transactions" CASCADE;');
    console.log('Tabela balance_transactions removida com sucesso.');

    console.log('Manutenção concluída. O servidor irá recriar a tabela no próximo início.');
    process.exit(0);
  } catch (error) {
    console.error('Erro na manutenção:', error);
    process.exit(1);
  }
}

fixDatabase();
