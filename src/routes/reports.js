const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Report } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all reports for current user
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

    const reports = await Report.findAll({
      where: whereClause,
      order: [['month', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        reports,
        count: reports.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get report by month
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

    const report = await Report.findOne({
      where: {
        user_id: req.user.id,
        month
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé pour ce mois'
      });
    }

    res.json({
      success: true,
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create report
router.post('/', authenticateToken, [
  body('month')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('Le format du mois doit être YYYY-MM'),
  body('pdf_url')
    .isURL()
    .withMessage('L\'URL du PDF doit être valide')
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

    const { month, pdf_url } = req.body;

    // Check if report already exists for this month
    const existingReport = await Report.findOne({
      where: {
        user_id: req.user.id,
        month
      }
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: 'Un rapport existe déjà pour ce mois'
      });
    }

    const report = await Report.create({
      user_id: req.user.id,
      month,
      pdf_url
    });

    logger.info(`Report created for user ${req.user.email}: ${month}`);

    res.status(201).json({
      success: true,
      message: 'Rapport créé avec succès',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update report
router.put('/:month', authenticateToken, [
  param('month')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('Le format du mois doit être YYYY-MM'),
  body('pdf_url')
    .isURL()
    .withMessage('L\'URL du PDF doit être valide')
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
    const { pdf_url } = req.body;

    const report = await Report.findOne({
      where: {
        user_id: req.user.id,
        month
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé pour ce mois'
      });
    }

    await report.update({ pdf_url });
    await report.reload();

    logger.info(`Report updated for user ${req.user.email}: ${month}`);

    res.json({
      success: true,
      message: 'Rapport mis à jour avec succès',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete report
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

    const deleted = await Report.destroy({
      where: {
        user_id: req.user.id,
        month
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé pour ce mois'
      });
    }

    logger.info(`Report deleted for user ${req.user.email}: ${month}`);

    res.json({
      success: true,
      message: 'Rapport supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;