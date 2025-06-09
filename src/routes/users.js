const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update current user profile
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Adresse email invalide')
    .normalizeEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    await req.user.update(updateData);
    await req.user.reload();

    logger.info(`User profile updated: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate current password
    const isValidPassword = await req.user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Update password
    await req.user.update({ password: newPassword });

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res, next) => {
  try {
    await req.user.destroy();

    logger.info(`User account deleted: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;