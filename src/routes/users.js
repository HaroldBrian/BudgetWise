const express = require("express");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { isAuthenticated } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");
const bcrypt = require("bcrypt");

const router = express.Router();

// Get current user profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    res.render("users/profile", {
      title: "Mon Profil",
      user: req.session.user,
    });
  } catch (error) {
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
        return res.redirect("/profile");
      }

      const { name, email } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        req.session.message = {
          type: "warning",
          message: "Aucune donnée à mettre à jour",
        };
        return res.redirect("/profile");
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
      res.redirect("/profile");
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la mise à jour du profil",
      };
      res.redirect("/profile");
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
        return res.redirect("/profile");
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.session.user.id);

      // Validate current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        req.session.message = {
          type: "danger",
          message: "Mot de passe actuel incorrect",
        };
        return res.redirect("/profile");
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      logger.info(`Password changed for user: ${user.email}`);

      req.session.message = {
        type: "success",
        message: "Mot de passe mis à jour avec succès",
      };
      res.redirect("/profile");
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Erreur lors du changement de mot de passe",
      };
      res.redirect("/profile");
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
        console.error("Erreur lors de la destruction de la session:", err);
      }
      res.redirect("/");
    });
  } catch (error) {
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la suppression du compte",
    };
    res.redirect("/profile");
  }
});

module.exports = router;
