module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      validate: {
        isValidMonth(value) {
          const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
          if (!monthRegex.test(value)) {
            throw new Error('Le format du mois doit être YYYY-MM');
          }
        }
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Le montant doit être un nombre décimal'
        },
        min: {
          args: [0],
          msg: 'Le montant ne peut pas être négatif'
        }
      }
    }
  }, {
    tableName: 'budgets',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month'],
        name: 'unique_user_month_budget'
      }
    ]
  });

  return Budget;
};