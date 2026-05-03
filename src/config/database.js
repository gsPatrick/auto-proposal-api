const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: {
      ssl: false // Geralmente false para conexões diretas via IP, mude se o servidor exigir
    }
  }
);

module.exports = sequelize;
