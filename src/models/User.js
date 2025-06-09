const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le nom ne peut pas être vide'
        },
        len: {
          args: [2, 100],
          msg: 'Le nom doit contenir entre 2 et 100 caractères'
        }
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: {
        msg: 'Cette adresse email est déjà utilisée'
      },
      validate: {
        isEmail: {
          msg: 'Adresse email invalide'
        },
        notEmpty: {
          msg: 'L\'email ne peut pas être vide'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le mot de passe ne peut pas être vide'
        },
        len: {
          args: [6, 255],
          msg: 'Le mot de passe doit contenir au moins 6 caractères'
        }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};