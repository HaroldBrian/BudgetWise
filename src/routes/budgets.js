const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Budget } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all budgets for current user
router.get('/', authenticateToken, [
  query('year')
    .optional()
    .isInt({ min: 2000, max: 3000 })
    .withMessage('L\'année doit être valide')
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

    const { year } = req.query;
    const whereClause = { user_id: req.user.id };

    if (year) {
      whereClause.month = {
        [require('sequelize').Op.like]: `${year}-%`
      };
    }

    const budgets = await Budget.findAll({
      where: whereClause,
      order: [['month', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        budgets,
        count: budgets.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get budget by month
router.get('/:month', authenticateToken, [
  param('month')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('Le format du mois doit être YYYY-MM')
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

    const { month } = req.params;

    const budget = await Budget.findOne({
      where: {
        user_id: req.user.id,
        month
      }
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget non trouvé pour ce mois'
      });
    }

    res.json({
      success: true,
      data: {
        budget
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create or update budget
router.post('/', authenticateToken, [
  body('month')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('Le format du mois doit être YYYY-MM'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Le montant doit être un nombre positif')
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

    const { month, amount } = req.body;

    const [budget, created] = await Budget.upsert({
      user_id: req.user.id,
      month,
      amount
    });

    logger.info(`Budget ${created ? 'created' : 'updated'} for user ${req.user.email}: ${month} - ${amount}`);

    res.status(created ? 201 : 200).json({
      success: true,
      message: `Budget ${created ? 'créé' : 'mis à jour'} avec succès`,
      data: {
        budget
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete budget
router.delete('/:month', authenticateToken, [
  param('month')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('Le format du mois doit être YYYY-MM')
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

    const { month } = req.params;

    const deleted = await Budget.destroy({
      where: {
        user_id: req.user.id,
        month
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Budget non trouvé pour ce mois'
      });
    }

    logger.info(`Budget deleted for user ${req.user.email}: ${month}`);

    res.json({
      success: true,
      message: 'Budget supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;