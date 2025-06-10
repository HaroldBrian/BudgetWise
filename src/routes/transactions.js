const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const { Transaction } = require("../models");
const { isAuthenticated } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// Get all transactions for current user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.session.user.id },
      order: [["date", "DESC"]],
    });
    res.render("transactions/index", {
      title: "Mes Transactions",
      transactions,
      user: req.session.user,
    });
  } catch (error) {
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la récupération des transactions",
    };
    res.redirect("/dashboard");
  }
});

// Get transaction by ID
router.get(
  "/:id",
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
          userId: req.session.user.id,
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

// Create transaction
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { amount, description, category, type, date } = req.body;
    const transaction = await Transaction.create({
      amount,
      description,
      category,
      type,
      date,
      userId: req.session.user.id,
    });

    req.session.message = {
      type: "success",
      message: "Transaction créée avec succès",
    };
    res.redirect("/transactions");
  } catch (error) {
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la création de la transaction",
    };
    res.redirect("/transactions");
  }
});

// Update transaction
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, category, type, date } = req.body;

    const transaction = await Transaction.findOne({
      where: { id, userId: req.session.user.id },
    });

    if (!transaction) {
      req.session.message = {
        type: "danger",
        message: "Transaction non trouvée",
      };
      return res.redirect("/transactions");
    }

    await transaction.update({ amount, description, category, type, date });

    req.session.message = {
      type: "success",
      message: "Transaction mise à jour avec succès",
    };
    res.redirect("/transactions");
  } catch (error) {
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la mise à jour de la transaction",
    };
    res.redirect("/transactions");
  }
});

// Delete transaction
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({
      where: { id, userId: req.session.user.id },
    });

    if (!transaction) {
      req.session.message = {
        type: "danger",
        message: "Transaction non trouvée",
      };
      return res.redirect("/transactions");
    }

    await transaction.destroy();

    req.session.message = {
      type: "success",
      message: "Transaction supprimée avec succès",
    };
    res.redirect("/transactions");
  } catch (error) {
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la suppression de la transaction",
    };
    res.redirect("/transactions");
  }
});

module.exports = router;
