const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Alert, Transaction } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all alerts for user's transactions
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const alerts = await Alert.findAll({
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { user_id: req.user.id },
        attributes: ['id', 'type', 'amount', 'description', 'category', 'date']
      }],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get alert by ID
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

    const alert = await Alert.findOne({
      where: { id },
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { user_id: req.user.id },
        attributes: ['id', 'type', 'amount', 'description', 'category', 'date']
      }]
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      });
    }

    res.json({
      success: true,
      data: {
        alert
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create alert
router.post('/', authenticateToken, [
  body('transaction_id')
    .isInt()
    .withMessage('L\'ID de transaction doit être un entier'),
  body('threshold')
    .isFloat({ min: 0 })
    .withMessage('Le seuil doit être un nombre positif'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active doit être un booléen')
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

    const { transaction_id, threshold, active = true } = req.body;

    // Verify that the transaction belongs to the current user
    const transaction = await Transaction.findOne({
      where: {
        id: transaction_id,
        user_id: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    const alert = await Alert.create({
      transaction_id,
      threshold,
      active
    });

    logger.info(`Alert created for user ${req.user.email}: transaction ${transaction_id} - threshold ${threshold}`);

    res.status(201).json({
      success: true,
      message: 'Alerte créée avec succès',
      data: {
        alert
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update alert
router.put('/:id', authenticateToken, [
  param('id')
    .isInt()
    .withMessage('L\'ID doit être un entier'),
  body('threshold')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le seuil doit être un nombre positif'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active doit être un booléen')
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

    const alert = await Alert.findOne({
      where: { id },
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { user_id: req.user.id }
      }]
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      });
    }

    await alert.update(req.body);
    await alert.reload();

    logger.info(`Alert updated for user ${req.user.email}: ID ${id}`);

    res.json({
      success: true,
      message: 'Alerte mise à jour avec succès',
      data: {
        alert
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete alert
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

    const alert = await Alert.findOne({
      where: { id },
      include: [{
        model: Transaction,
        as: 'transaction',
        where: { user_id: req.user.id }
      }]
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      });
    }

    await alert.destroy();

    logger.info(`Alert deleted for user ${req.user.email}: ID ${id}`);

    res.json({
      success: true,
      message: 'Alerte supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;