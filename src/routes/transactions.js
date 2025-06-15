/* eslint-disable no-unused-vars */
const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { Transaction } = require("../models");
const { isAuthenticated } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

const router = express.Router();

// Get all transactions for current user (Page)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      tags,
      page = 1,
      limit = 10,
    } = req.query;

    const whereClause = { user_id: req.session.user.id };

    // Filtres
    if (type && ["income", "expense"].includes(type)) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = { [Op.like]: `%${category}%` };
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      whereClause.date = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.date = { [Op.lte]: endDate };
    }

    if (tags) {
      whereClause.tags = { [Op.like]: `%${tags}%` };
    }

    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      order: [["date", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    // Calculer les statistiques
    const allTransactions = await Transaction.findAll({
      where: { user_id: req.session.user.id },
    });

    const totalIncome = allTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = allTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const categories = [
      ...new Set(allTransactions.map((t) => t.category).filter(Boolean)),
    ];
    const allTags = [...new Set(allTransactions.flatMap((t) => t.tags || []))];

    res.render("transactions/index", {
      title: "Mes Transactions",
      transactions,
      user: req.session.user,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: { type, category, startDate, endDate, tags },
      categories,
      allTags,
      stats: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      },
    });
  } catch (error) {
    logger.error("Error fetching transactions:", error);
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la récupération des transactions",
    };
    res.redirect("/dashboard");
  }
});

// Get transaction by ID (API)
router.get(
  "/api/:id",
  isAuthenticated,
  [param("id").isInt().withMessage("L'ID doit être un entier")],
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

      const { id } = req.params;

      const transaction = await Transaction.findOne({
        where: {
          id,
          user_id: req.session.user.id,
        },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction non trouvée",
        });
      }

      res.json({
        success: true,
        data: {
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get all transactions (API)
router.get("/api", isAuthenticated, async (req, res, next) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;

    const whereClause = { user_id: req.session.user.id };
    if (type && ["income", "expense"].includes(type)) {
      whereClause.type = type;
    }

    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      order: [["date", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create transaction
router.post(
  "/",
  isAuthenticated,
  [
    body("type")
      .isIn(["income", "expense"])
      .withMessage("Le type doit être 'income' ou 'expense'"),
    body("amount")
      .isFloat({ min: 0 })
      .withMessage("Le montant doit être un nombre positif"),
    body("date").isDate().withMessage("La date doit être valide"),
    body("description")
      .optional()
      .isLength({ max: 255 })
      .withMessage("La description ne peut pas dépasser 255 caractères"),
    body("category")
      .optional()
      .isLength({ max: 100 })
      .withMessage("La catégorie ne peut pas dépasser 100 caractères"),
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
        return res.redirect("/transactions");
      }

      const { amount, description, category, type, date, tags, is_recurring } =
        req.body;

      const transaction = await Transaction.create({
        user_id: req.session.user.id,
        amount: parseFloat(amount),
        description,
        category,
        type,
        date,
        tags: Array.isArray(tags)
          ? tags
          : tags
          ? tags.split(",").map((t) => t.trim())
          : [],
        is_recurring: is_recurring === "on" || is_recurring === true,
      });

      logger.info(
        `Transaction created for user ${req.session.user.email}: ${type} - ${amount}`
      );

      req.session.message = {
        type: "success",
        message: "Transaction créée avec succès",
      };
      res.redirect("/transactions");
    } catch (error) {
      logger.error("Error creating transaction:", error);
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la création de la transaction",
      };
      res.redirect("/transactions");
    }
  }
);

// Update transaction
router.post(
  "/:id/edit",
  isAuthenticated,
  [
    param("id").isInt().withMessage("L'ID doit être un entier"),
    body("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("Le type doit être 'income' ou 'expense'"),
    body("amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Le montant doit être un nombre positif"),
    body("date").optional().isDate().withMessage("La date doit être valide"),
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
        return res.redirect("/transactions");
      }

      const { id } = req.params;
      const { amount, description, category, type, date, tags, is_recurring } =
        req.body;

      const transaction = await Transaction.findOne({
        where: { id, user_id: req.session.user.id },
      });

      if (!transaction) {
        req.session.message = {
          type: "danger",
          message: "Transaction non trouvée",
        };
        return res.redirect("/transactions");
      }

      const updateData = {};
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (type !== undefined) updateData.type = type;
      if (date !== undefined) updateData.date = date;
      if (tags !== undefined)
        updateData.tags = Array.isArray(tags)
          ? tags
          : tags
          ? tags.split(",").map((t) => t.trim())
          : [];
      if (is_recurring !== undefined)
        updateData.is_recurring =
          is_recurring === "on" || is_recurring === true;

      await transaction.update(updateData);

      logger.info(
        `Transaction updated for user ${req.session.user.email}: ID ${id}`
      );

      req.session.message = {
        type: "success",
        message: "Transaction mise à jour avec succès",
      };
      res.redirect("/transactions");
    } catch (error) {
      logger.error("Error updating transaction:", error);
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la mise à jour de la transaction",
      };
      res.redirect("/transactions");
    }
  }
);

// Delete transaction
router.post(
  "/:id/delete",
  isAuthenticated,
  [param("id").isInt().withMessage("L'ID doit être un entier")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.session.message = {
          type: "danger",
          message: "Erreurs de validation",
          errors: errors.array(),
        };
        return res.redirect("/transactions");
      }

      const { id } = req.params;
      const transaction = await Transaction.findOne({
        where: { id, user_id: req.session.user.id },
      });

      if (!transaction) {
        req.session.message = {
          type: "danger",
          message: "Transaction non trouvée",
        };
        return res.redirect("/transactions");
      }

      await transaction.destroy();

      logger.info(
        `Transaction deleted for user ${req.session.user.email}: ID ${id}`
      );

      req.session.message = {
        type: "success",
        message: "Transaction supprimée avec succès",
      };
      res.redirect("/transactions");
    } catch (error) {
      logger.error("Error deleting transaction:", error);
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la suppression de la transaction",
      };
      res.redirect("/transactions");
    }
  }
);

module.exports = router;
