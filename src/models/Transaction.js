module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM("income", "expense"),
        allowNull: false,
        validate: {
          isIn: {
            args: [["income", "expense"]],
            msg: 'Le type doit être "income" ou "expense"',
          },
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: "Le montant doit être un nombre décimal",
          },
          min: {
            args: [0],
            msg: "Le montant ne peut pas être négatif",
          },
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: {
            msg: "La date doit être au format valide",
          },
        },
      },
      tags: {
        type: DataTypes.STRING(255),
        allowNull: true,
        get() {
          const rawValue = this.getDataValue("tags");
          return rawValue ? rawValue.split(",").map((tag) => tag.trim()) : [];
        },
        set(value) {
          if (Array.isArray(value)) {
            this.setDataValue("tags", value.join(","));
          } else if (typeof value === "string") {
            this.setDataValue("tags", value);
          } else {
            this.setDataValue("tags", null);
          }
        },
      },
      is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "transactions",
      timestamps: false,
      indexes: [
        {
          fields: ["user_id", "date"],
        },
        {
          fields: ["type"],
        },
        {
          fields: ["category"],
        },
      ],
    }
  );

  return Transaction;
};
