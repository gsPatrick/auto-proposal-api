const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Setting;
