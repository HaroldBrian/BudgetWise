const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const logger = require("../utils/logger");

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("name")
      .notEmpty()
      .withMessage("Le nom est requis")
      .isLength({ min: 2, max: 100 })
      .withMessage("Le nom doit contenir entre 2 et 100 caractères"),
    body("email")
      .isEmail()
      .withMessage("Adresse email invalide")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
        res.redirect("/");
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.json({
          success: false,
          message: "Un utilisateur avec cette adresse email existe déjà",
        });
        res.redirect("/");
        return res.status(409).json({
          success: false,
          message: "Un utilisateur avec cette adresse email existe déjà",
        });
      }

      // Create user
      const user = await User.create({ name, email, password });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      logger.info(`New user registered: ${email}`);

      res.json({
        success: true,
        message: "Utilisateur créé avec succès",
        data: {
          user,
          token,
        },
      });
      res.status(201).json({
        success: true,
        message: "Utilisateur créé avec succès",
        data: {
          user,
          token,
        },
      });
      res.redirect("/dashboard");
    } catch (error) {
      next(error);
      res.redirect("/");
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Adresse email invalide")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Le mot de passe est requis"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
        res.redirect("/");
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
        res.redirect("/");
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        res.json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
        res.redirect("/");
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: "Connexion réussie",
        data: {
          user,
          token,
        },
      });

      res.redirect("/dashboard");
    } catch (error) {
      next(error);

      res.redirect("/");
    }
  }
);

module.exports = router;
