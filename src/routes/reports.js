const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const { Report } = require("../models");
const { isAuthenticated } = require("../middleware/auth");
const logger = require("../utils/logger");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

const router = express.Router();

// Get all reports for current user
router.get(
  "/",
  isAuthenticated,
  [
    query("year")
      .optional()
      .isInt({ min: 2000, max: 3000 })
      .withMessage("L'année doit être valide"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { year } = req.query;
      const whereClause = { user_id: req.session.user.id };

      if (year) {
        whereClause.month = {
          [require("sequelize").Op.like]: `${year}-%`,
        };
      }

      const reports = await Report.findAll({
        where: whereClause,
        order: [["month", "DESC"]],
      });

      res.json({
        success: true,
        data: {
          reports,
          count: reports.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get report by month
router.get(
  "/:month",
  isAuthenticated,
  [
    param("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Le format du mois doit être YYYY-MM"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { month } = req.params;

      const report = await Report.findOne({
        where: {
          user_id: req.session.user.id,
          month,
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Rapport non trouvé pour ce mois",
        });
      }

      res.json({
        success: true,
        data: {
          report,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create report
router.post(
  "/",
  isAuthenticated,
  [
    body("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Le format du mois doit être YYYY-MM"),
    body("pdf_url").isURL().withMessage("L'URL du PDF doit être valide"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { month, pdf_url } = req.body;

      // Check if report already exists for this month
      const existingReport = await Report.findOne({
        where: {
          user_id: req.session.user.id,
          month,
        },
      });

      if (existingReport) {
        return res.status(409).json({
          success: false,
          message: "Un rapport existe déjà pour ce mois",
        });
      }

      const report = await Report.create({
        user_id: req.session.user.id,
        month,
        pdf_url,
      });

      logger.info(
        `Report created for user ${req.session.user.email}: ${month}`
      );

      res.status(201).json({
        success: true,
        message: "Rapport créé avec succès",
        data: {
          report,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update report
router.put(
  "/:month",
  isAuthenticated,
  [
    param("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Le format du mois doit être YYYY-MM"),
    body("pdf_url").isURL().withMessage("L'URL du PDF doit être valide"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { month } = req.params;
      const { pdf_url } = req.body;

      const report = await Report.findOne({
        where: {
          user_id: req.session.user.id,
          month,
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Rapport non trouvé pour ce mois",
        });
      }

      await report.update({ pdf_url });
      await report.reload();

      logger.info(
        `Report updated for user ${req.session.user.email}: ${month}`
      );

      res.json({
        success: true,
        message: "Rapport mis à jour avec succès",
        data: {
          report,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete report
router.delete(
  "/:month",
  isAuthenticated,
  [
    param("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Le format du mois doit être YYYY-MM"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Erreurs de validation",
          errors: errors.array(),
        });
      }

      const { month } = req.params;

      const deleted = await Report.destroy({
        where: {
          user_id: req.session.user.id,
          month,
        },
      });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Rapport non trouvé pour ce mois",
        });
      }

      logger.info(
        `Report deleted for user ${req.session.user.email}: ${month}`
      );

      res.json({
        success: true,
        message: "Rapport supprimé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Route pour afficher la page des rapports
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Récupérer les transactions de l'utilisateur
    const transactions = await Transaction.find({ user: userId });

    // Récupérer les budgets de l'utilisateur
    const budgets = await Budget.find({ user: userId });

    // Calculer les statistiques
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    // Grouper les transactions par catégorie
    const expensesByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    // Calculer le pourcentage d'utilisation des budgets
    const budgetUsage = budgets.map((budget) => {
      const spent = transactions
        .filter(
          (t) => t.budget && t.budget.toString() === budget._id.toString()
        )
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...budget.toObject(),
        spent,
        percentage: (spent / budget.amount) * 100,
      };
    });

    res.render("reports/index", {
      totalExpenses,
      totalIncome,
      netBalance,
      expensesByCategory,
      budgetUsage,
    });
  } catch (error) {
    console.error("Erreur lors de la génération des rapports:", error);
    req.session.message = {
      type: "error",
      text: "Une erreur est survenue lors de la génération des rapports",
    };
    res.redirect("/");
  }
});

// Route pour générer un rapport mensuel
router.post(
  "/generate",
  isAuthenticated,
  [
    body("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Le format du mois doit être YYYY-MM"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.session.message = {
          type: "error",
          text: "Format de mois invalide",
        };
        return res.redirect("/reports");
      }

      const { month } = req.body;
      const userId = req.session.user.id;

      // Vérifier si un rapport existe déjà pour ce mois
      const existingReport = await Report.findOne({
        where: {
          user_id: userId,
          month,
        },
      });

      if (existingReport) {
        req.session.message = {
          type: "warning",
          text: "Un rapport existe déjà pour ce mois",
        };
        return res.redirect("/reports");
      }

      // Générer le rapport
      const transactions = await Transaction.find({
        user: userId,
        date: {
          $gte: new Date(`${month}-01`),
          $lt: new Date(`${month}-31`),
        },
      });

      const budgets = await Budget.find({
        user: userId,
      });

      // Calculer les statistiques du mois
      const monthlyStats = {
        totalIncome: transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0),
        expensesByCategory: transactions
          .filter((t) => t.type === "expense")
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {}),
        budgetUsage: budgets.map((budget) => {
          const spent = transactions
            .filter(
              (t) => t.budget && t.budget.toString() === budget._id.toString()
            )
            .reduce((sum, t) => sum + t.amount, 0);
          return {
            budgetId: budget._id,
            name: budget.name,
            spent,
            total: budget.amount,
            percentage: (spent / budget.amount) * 100,
          };
        }),
      };

      // Créer le rapport dans la base de données
      const report = await Report.create({
        user_id: userId,
        month,
        data: monthlyStats,
      });

      req.session.message = {
        type: "success",
        text: "Rapport généré avec succès" + report.data,
      };

      res.redirect("/reports");
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
      req.session.message = {
        type: "error",
        text: "Une erreur est survenue lors de la génération du rapport",
      };
      res.redirect("/reports");
    }
  }
);

module.exports = router;
