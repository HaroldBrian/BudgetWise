/* eslint-disable node/no-missing-require */
const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { isNotAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post(
  "/register",
  isNotAuthenticated,
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Le nom d'utilisateur doit contenir au moins 3 caractères"),
    body("email")
      .isEmail()
      .withMessage("Adresse email invalide")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
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
        return res.redirect("/");
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        req.session.message = {
          type: "danger",
          message: "Un utilisateur avec cet email existe déjà",
        };
        return res.redirect("/");
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      // Connecter automatiquement l'utilisateur
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      req.session.message = {
        type: "success",
        message: "Inscription réussie ! Bienvenue sur BudgetWise",
      };
      return res.redirect("/dashboard");
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Une erreur est survenue lors de l'inscription",
      };
      return res.redirect("/");
    }
  }
);

// Login
router.post(
  "/login",
  isNotAuthenticated,
  [
    body("email")
      .isEmail()
      .withMessage("Adresse email invalide")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Le mot de passe est requis"),
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
        return res.redirect("/");
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        req.session.message = {
          type: "danger",
          message: "Email ou mot de passe incorrect",
        };
        return res.redirect("/");
      }

      // Stocker les informations de l'utilisateur en session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      req.session.message = {
        type: "success",
        message: "Connexion réussie !",
      };
      return res.redirect("/");
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Une erreur est survenue lors de la connexion",
      };
      return res.redirect("/");
    }
  }
);

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
    return res.redirect("/");
  });
});

module.exports = router;
