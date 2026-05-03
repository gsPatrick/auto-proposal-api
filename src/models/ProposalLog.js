const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProposalLog = sequelize.define('ProposalLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false // '99freelas' ou 'freelancer'
  },
  proposalData: {
    type: DataTypes.JSONB,
    allowNull: false // Dados que foram enviados para a IA
  },
  aiResponse: {
    type: DataTypes.JSONB,
    allowNull: false // Resposta completa da IA (texto, preco, prazo)
  },
  tokensInput: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tokensOutput: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0.0
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
  timestamps: true
});

module.exports = ProposalLog;
