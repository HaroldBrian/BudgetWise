const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Budget = require('./Budget')(sequelize, Sequelize.DataTypes);
const Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);
const Alert = require('./Alert')(sequelize, Sequelize.DataTypes);
const Report = require('./Report')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Transaction.hasMany(Alert, { foreignKey: 'transaction_id', as: 'alerts' });
Alert.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = {
  sequelize,
  Sequelize,
  User,
  Budget,
  Transaction,
  Alert,
  Report
};

module.exports = db;