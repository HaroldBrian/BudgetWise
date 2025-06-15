/* eslint-disable no-unused-vars */
const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { Report, Transaction, Budget } = require("../models");
const { isAuthenticated } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

const router = express.Router();

// Route pour afficher la page des rapports
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Récupérer les transactions de l'utilisateur
    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      order: [["date", "DESC"]],
    });

    // Récupérer les budgets de l'utilisateur
    const budgets = await Budget.findAll({
      where: { user_id: userId },
      order: [["month", "DESC"]],
    });

    // Calculer les statistiques
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;

    // Grouper les transactions par catégorie
    const expensesByCategory = transactions
      .filter((t) => t.type === "expense" && t.category)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {});

    // Calculer le pourcentage d'utilisation des budgets
    const budgetUsage = budgets.map((budget) => {
      const budgetMonth = budget.month;
      const monthTransactions = transactions.filter((t) => {
        const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
        return transactionMonth === budgetMonth && t.type === "expense";
      });

      const spent = monthTransactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      );

      return {
        id: budget.id,
        month: budget.month,
        name: new Date(budget.month + "-01").toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
        }),
        amount: parseFloat(budget.amount),
        spent,
        percentage:
          budget.amount > 0 ? (spent / parseFloat(budget.amount)) * 100 : 0,
      };
    });

    // Évolution mensuelle
    const monthlyData = {};
    transactions.forEach((t) => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (t.type === "income") {
        monthlyData[month].income += parseFloat(t.amount);
      } else {
        monthlyData[month].expenses += parseFloat(t.amount);
      }
    });

    const monthlyEvolution = Object.keys(monthlyData)
      .sort()
      .slice(-6) // Derniers 6 mois
      .map((month) => ({
        month,
        monthName: new Date(month + "-01").toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "short",
        }),
        income: monthlyData[month].income,
        expenses: monthlyData[month].expenses,
        balance: monthlyData[month].income - monthlyData[month].expenses,
      }));

    res.render("reports/index", {
      title: "Rapports Financiers",
      user: req.session.user,
      totalExpenses: totalExpenses.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      netBalance: netBalance.toFixed(2),
      expensesByCategory,
      budgetUsage,
      monthlyEvolution,
      stats: {
        totalTransactions: transactions.length,
        avgMonthlyIncome:
          monthlyEvolution.length > 0
            ? (
                monthlyEvolution.reduce((sum, m) => sum + m.income, 0) /
                monthlyEvolution.length
              ).toFixed(2)
            : 0,
        avgMonthlyExpenses:
          monthlyEvolution.length > 0
            ? (
                monthlyEvolution.reduce((sum, m) => sum + m.expenses, 0) /
                monthlyEvolution.length
              ).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    logger.error("Erreur lors de la génération des rapports:", error);
    req.session.message = {
      type: "danger",
      message: "Une erreur est survenue lors de la génération des rapports",
    };
    res.redirect("/dashboard");
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
          type: "danger",
          message: "Format de mois invalide",
          errors: errors.array(),
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
          message: "Un rapport existe déjà pour ce mois",
        };
        return res.redirect("/reports");
      }

      // Générer le rapport
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0
      );

      const transactions = await Transaction.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
        order: [["date", "ASC"]],
      });

      const budget = await Budget.findOne({
        where: {
          user_id: userId,
          month,
        },
      });

      // Calculer les statistiques du mois
      const monthlyStats = {
        totalIncome: transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalExpenses: transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        expensesByCategory: transactions
          .filter((t) => t.type === "expense" && t.category)
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
            return acc;
          }, {}),
        transactionCount: transactions.length,
        budgetAmount: budget ? parseFloat(budget.amount) : 0,
        budgetUsed: budget
          ? (transactions
              .filter((t) => t.type === "expense")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0) /
              parseFloat(budget.amount)) *
            100
          : 0,
      };

      // Créer le rapport dans la base de données
      const report = await Report.create({
        user_id: userId,
        month,
        pdf_url: `/reports/${userId}/${month}.json`,
      });

      logger.info(
        `Report generated for user ${req.session.user.email}: ${month}`
      );

      req.session.message = {
        type: "success",
        message: `Rapport généré avec succès pour ${new Date(
          month + "-01"
        ).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}`,
      };

      res.redirect("/reports");
    } catch (error) {
      logger.error("Erreur lors de la génération du rapport:", error);
      req.session.message = {
        type: "danger",
        message: "Une erreur est survenue lors de la génération du rapport",
      };
      res.redirect("/reports");
    }
  }
);

router.get(
  "/api",
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
          [Op.like]: `${year}-%`,
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

module.exports = router;
