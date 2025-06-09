module.exports = (sequelize, DataTypes) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    threshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Le seuil doit être un nombre décimal'
        },
        min: {
          args: [0],
          msg: 'Le seuil ne peut pas être négatif'
        }
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'alerts',
    timestamps: false
  });

  return Alert;
};