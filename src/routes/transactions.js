const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Transaction } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all transactions for current user
router.get('/', authenticateToken, [
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Le type doit être "income" ou "expense"'),
  query('category')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('La catégorie doit contenir entre 1 et 100 caractères'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('La date de début doit être au format ISO 8601'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('La date de fin doit être au format ISO 8601'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100')
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

    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const whereClause = { user_id: req.user.id };

    if (type) whereClause.type = type;
    if (category) whereClause.category = category;

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[require('sequelize').Op.gte] = startDate;
      if (endDate) whereClause.date[require('sequelize').Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC'], ['id', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, [
  param('id')
    .isInt()
    .withMessage('L\'ID doit être un entier')
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

    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    res.json({
      success: true,
      data: {
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create transaction
router.post('/', authenticateToken, [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Le type doit être "income" ou "expense"'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Le montant doit être un nombre positif'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La catégorie ne peut pas dépasser 100 caractères'),
  body('date')
    .isISO8601()
    .withMessage('La date doit être au format ISO 8601'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Les tags doivent être un tableau'),
  body('is_recurring')
    .optional()
    .isBoolean()
    .withMessage('is_recurring doit être un booléen')
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

    const transactionData = {
      ...req.body,
      user_id: req.user.id
    };

    const transaction = await Transaction.create(transactionData);

    logger.info(`Transaction created for user ${req.user.email}: ${transaction.type} - ${transaction.amount}`);

    res.status(201).json({
      success: true,
      message: 'Transaction créée avec succès',
      data: {
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update transaction
router.put('/:id', authenticateToken, [
  param('id')
    .isInt()
    .withMessage('L\'ID doit être un entier'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Le type doit être "income" ou "expense"'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le montant doit être un nombre positif'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La catégorie ne peut pas dépasser 100 caractères'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('La date doit être au format ISO 8601'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Les tags doivent être un tableau'),
  body('is_recurring')
    .optional()
    .isBoolean()
    .withMessage('is_recurring doit être un booléen')
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

    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    await transaction.update(req.body);
    await transaction.reload();

    logger.info(`Transaction updated for user ${req.user.email}: ID ${id}`);

    res.json({
      success: true,
      message: 'Transaction mise à jour avec succès',
      data: {
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, [
  param('id')
    .isInt()
    .withMessage('L\'ID doit être un entier')
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

    const { id } = req.params;

    const deleted = await Transaction.destroy({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    logger.info(`Transaction deleted for user ${req.user.email}: ID ${id}`);

    res.json({
      success: true,
      message: 'Transaction supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;