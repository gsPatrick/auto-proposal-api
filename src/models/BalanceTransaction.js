const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BalanceTransaction = sequelize.define('BalanceTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('deposit', 'usage'),
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: true // Pode ser nulo para depósitos gerais se houver, mas idealmente vinculado
  },
  amount: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false
  },
  previousBalance: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false
  },
  newBalance: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'balance_transactions',
  timestamps: true
});

module.exports = BalanceTransaction;
