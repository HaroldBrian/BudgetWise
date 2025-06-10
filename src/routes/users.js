const express = require("express");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { isAuthenticated } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Get current user profile (Page)
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    
    res.render("users/profile", {
      title: "Mon Profil",
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error("Error fetching user profile:", error);
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la récupération du profil",
    };
    res.redirect("/dashboard");
  }
});

// Update current user profile
router.post(
  "/profile",
  isAuthenticated,
  [
    body("name")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Le nom doit contenir entre 2 et 100 caractères"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Adresse email invalide")
      .normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.session.message = {
          type: "danger",
          message: "Erreurs de validation",
          errors: errors.array(),
        };
        return res.redirect("/users/profile");
      }

      const { name, email } = req.body;
      const updateData = {};

      if (name && name.trim()) updateData.name = name.trim();
      if (email && email.trim()) updateData.email = email.trim();

      if (Object.keys(updateData).length === 0) {
        req.session.message = {
          type: "warning",
          message: "Aucune donnée à mettre à jour",
        };
        return res.redirect("/users/profile");
      }

      // Vérifier si l'email existe déjà
      if (updateData.email) {
        const existingUser = await User.findOne({
          where: { 
            email: updateData.email,
            id: { [require('sequelize').Op.ne]: req.session.user.id }
          }
        });
        
        if (existingUser) {
          req.session.message = {
            type: "danger",
            message: "Cette adresse email est déjà utilisée par un autre utilisateur",
          };
          return res.redirect("/users/profile");
        }
      }

      const user = await User.findByPk(req.session.user.id);
      await user.update(updateData);

      // Mettre à jour la session
      req.session.user = {
        ...req.session.user,
        ...updateData,
      };

      logger.info(`User profile updated: ${user.email}`);

      req.session.message = {
        type: "success",
        message: "Profil mis à jour avec succès",
      };
      res.redirect("/users/profile");
    } catch (error) {
      logger.error("Error updating user profile:", error);
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la mise à jour du profil",
      };
      res.redirect("/users/profile");
    }
  }
);

// Change password
router.post(
  "/password",
  isAuthenticated,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Le mot de passe actuel est requis"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage(
        "Le nouveau mot de passe doit contenir au moins 6 caractères"
      ),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Les mots de passe ne correspondent pas");
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.session.message = {
          type: "danger",
          message: "Erreurs de validation",
          errors: errors.array(),
        };
        return res.redirect("/users/profile");
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.session.user.id);

      // Validate current password
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        req.session.message = {
          type: "danger",
          message: "Mot de passe actuel incorrect",
        };
        return res.redirect("/users/profile");
      }

      // Update password
      await user.update({ password: newPassword });

      logger.info(`Password changed for user: ${user.email}`);

      req.session.message = {
        type: "success",
        message: "Mot de passe mis à jour avec succès",
      };
      res.redirect("/users/profile");
    } catch (error) {
      logger.error("Error changing password:", error);
      req.session.message = {
        type: "danger",
        message: "Erreur lors du changement de mot de passe",
      };
      res.redirect("/users/profile");
    }
  }
);

// Delete account
router.post("/account/delete", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    await user.destroy();

    logger.info(`User account deleted: ${user.email}`);

    req.session.destroy((err) => {
      if (err) {
        logger.error("Error destroying session:", err);
      }
      res.redirect("/");
    });
  } catch (error) {
    logger.error("Error deleting account:", error);
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la suppression du compte",
    };
    res.redirect("/users/profile");
  }
});

module.exports = router;