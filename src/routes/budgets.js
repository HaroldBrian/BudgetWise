const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { Budget } = require("../models");
const { isAuthenticated } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const budgets = await Budget.findAll({
      where: { user_id: req.session.user.id },
      order: [["month", "DESC"]],
    });

    res.render("budgets/index", {
      title: "Mes Budgets",
      budgets,
      user: req.session.user,
    });
  } catch (error) {
    logger.error("Error fetching budgets:", error);
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la récupération des budgets",
    };
    res.redirect("/dashboard");
  }
});

router.get(
  "/api/:month",
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

      const budget = await Budget.findOne({
        where: {
          user_id: req.session.user.id,
          month,
        },
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: "Budget non trouvé pour ce mois",
        });
      }

      res.json({
        success: true,
        data: {
          budget,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  isAuthenticated,
  [
    body("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Le format du mois doit être YYYY-MM"),
    body("amount")
      .isFloat({ min: 0 })
      .withMessage("Le montant doit être un nombre positif"),
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
        return res.redirect("/budgets");
      }

      const { month, amount } = req.body;

      const [created] = await Budget.upsert({
        user_id: req.session.user.id,
        month,
        amount,
      });

      logger.info(
        `Budget ${created ? "created" : "updated"} for user ${
          req.session.user.email
        }: ${month} - ${amount}`
      );

      req.session.message = {
        type: "success",
        message: `Budget ${created ? "créé" : "mis à jour"} avec succès`,
      };
      res.redirect("/budgets");
    } catch (error) {
      logger.error("Error creating/updating budget:", error);
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la création ou de la mise à jour du budget",
      };
      res.redirect("/budgets");
    }
  }
);

router.post(
  "/:month/delete",
  isAuthenticated,
  [
    param("month")
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage("Le format du mois doit être YYYY-MM"),
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
        return res.redirect("/budgets");
      }

      const { month } = req.params;

      const deleted = await Budget.destroy({
        where: {
          user_id: req.session.user.id,
          month,
        },
      });

      if (!deleted) {
        req.session.message = {
          type: "danger",
          message: "Budget non trouvé pour ce mois",
        };
        return res.redirect("/budgets");
      }

      logger.info(
        `Budget deleted for user ${req.session.user.email}: ${month}`
      );

      req.session.message = {
        type: "success",
        message: "Budget supprimé avec succès",
      };
      res.redirect("/budgets");
    } catch (error) {
      logger.error("Error deleting budget:", error);
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la suppression du budget",
      };
      res.redirect("/budgets");
    }
  }
);

module.exports = router;
