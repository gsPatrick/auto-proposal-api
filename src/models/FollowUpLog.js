const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Trilha de auditoria dos follow-ups automaticos.
// A extensao grava aqui em best-effort: se a API estiver fora, o follow-up e enviado
// mesmo assim e apenas o log se perde. Nunca torne este insert obrigatorio no fluxo.
const FollowUpLog = sequelize.define('FollowUpLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false // id da conversa no 99freelas (/messages/inbox/<id>)
  },
  platform: {
    type: DataTypes.STRING,
    defaultValue: '99freelas'
  },
  trilha: {
    type: DataTypes.STRING,
    allowNull: false // 'A' (nunca respondeu) ou 'B' (respondeu e sumiu)
  },
  tentativa: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  projeto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cliente: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false // texto exatamente como foi enviado, ja pos-travas de saida
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['conversationId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = FollowUpLog;
