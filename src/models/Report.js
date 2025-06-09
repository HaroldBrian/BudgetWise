module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
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
    pdf_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isUrl: {
          msg: 'L\'URL du PDF doit être valide'
        }
      }
    }
  }, {
    tableName: 'reports',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month'],
        name: 'unique_user_month_report'
      }
    ]
  });

  return Report;
};