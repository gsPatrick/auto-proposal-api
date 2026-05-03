const ProposalLog = require('./src/models/ProposalLog');
const sequelize = require('./src/config/database');

async function updateLastLog() {
    try {
        await sequelize.authenticate();
        console.log('Conectado ao banco de dados.');

        // Busca o último log
        const lastLog = await ProposalLog.findOne({
            order: [['createdAt', 'DESC']]
        });

        if (lastLog) {
            console.log(`Log encontrado: ID ${lastLog.id}, Plataforma atual: ${lastLog.platform}`);
            
            // Atualiza para workana
            lastLog.platform = 'workana';
            await lastLog.save();
            
            console.log('✅ Log atualizado com sucesso para: workana');
        } else {
            console.log('Nenhum log encontrado.');
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await sequelize.close();
    }
}

updateLastLog();
