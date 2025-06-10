const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { Alert, Transaction } = require("../models");
const { isAuthenticated } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// Get all alerts for user's transactions
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      include: [
        {
          model: Transaction,
          as: "transaction",
          where: { userId: req.session.user.id },
          attributes: [
            "id",
            "type",
            "amount",
            "description",
            "category",
            "date",
          ],
        },
      ],
      order: [["id", "DESC"]],
    });

    res.render("alerts/index", {
      title: "Mes Alertes",
      alerts,
      user: req.session.user,
    });
  } catch (error) {
    req.session.message = {
      type: "danger",
      message: "Erreur lors de la récupération des alertes",
    };
    res.redirect("/dashboard");
  }
});

// Get alert by ID
router.get(
  "/:id",
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
        return res.redirect("/alerts");
      }

      const { id } = req.params;

      const alert = await Alert.findOne({
        where: { id },
        include: [
          {
            model: Transaction,
            as: "transaction",
            where: { userId: req.session.user.id },
            attributes: [
              "id",
              "type",
              "amount",
              "description",
              "category",
              "date",
            ],
          },
        ],
      });

      if (!alert) {
        req.session.message = {
          type: "danger",
          message: "Alerte non trouvée",
        };
        return res.redirect("/alerts");
      }

      res.render("alerts/show", {
        title: "Détails de l'alerte",
        alert,
        user: req.session.user,
      });
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la récupération de l'alerte",
      };
      res.redirect("/alerts");
    }
  }
);

// Create alert
router.post(
  "/",
  isAuthenticated,
  [
    body("transaction_id")
      .isInt()
      .withMessage("L'ID de transaction doit être un entier"),
    body("threshold")
      .isFloat({ min: 0 })
      .withMessage("Le seuil doit être un nombre positif"),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Active doit être un booléen"),
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
        return res.redirect("/alerts");
      }

      const { transaction_id, threshold, active = true } = req.body;

      // Verify that the transaction belongs to the current user
      const transaction = await Transaction.findOne({
        where: {
          id: transaction_id,
          userId: req.session.user.id,
        },
      });

      if (!transaction) {
        req.session.message = {
          type: "danger",
          message: "Transaction non trouvée",
        };
        return res.redirect("/alerts");
      }

      const alert = await Alert.create({
        transaction_id,
        threshold,
        active,
      });

      logger.info(
        `Alert created for user ${req.session.user.email}: transaction ${transaction_id} - threshold ${threshold}`
      );

      req.session.message = {
        type: "success",
        message: "Alerte créée avec succès",
      };
      res.redirect("/alerts");
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la création de l'alerte",
      };
      res.redirect("/alerts");
    }
  }
);

// Update alert
router.post(
  "/:id",
  isAuthenticated,
  [
    param("id").isInt().withMessage("L'ID doit être un entier"),
    body("threshold")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Le seuil doit être un nombre positif"),
    body("active")
      .optional()
      .isBoolean()
      .withMessage("Active doit être un booléen"),
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
        return res.redirect("/alerts");
      }

      const { id } = req.params;

      const alert = await Alert.findOne({
        where: { id },
        include: [
          {
            model: Transaction,
            as: "transaction",
            where: { userId: req.session.user.id },
          },
        ],
      });

      if (!alert) {
        req.session.message = {
          type: "danger",
          message: "Alerte non trouvée",
        };
        return res.redirect("/alerts");
      }

      await alert.update(req.body);
      await alert.reload();

      logger.info(`Alert updated for user ${req.session.user.email}: ID ${id}`);

      req.session.message = {
        type: "success",
        message: "Alerte mise à jour avec succès",
      };
      res.redirect("/alerts");
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la mise à jour de l'alerte",
      };
      res.redirect("/alerts");
    }
  }
);

// Delete alert
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
        return res.redirect("/alerts");
      }

      const { id } = req.params;

      const alert = await Alert.findOne({
        where: { id },
        include: [
          {
            model: Transaction,
            as: "transaction",
            where: { userId: req.session.user.id },
          },
        ],
      });

      if (!alert) {
        req.session.message = {
          type: "danger",
          message: "Alerte non trouvée",
        };
        return res.redirect("/alerts");
      }

      await alert.destroy();

      logger.info(`Alert deleted for user ${req.session.user.email}: ID ${id}`);

      req.session.message = {
        type: "success",
        message: "Alerte supprimée avec succès",
      };
      res.redirect("/alerts");
    } catch (error) {
      req.session.message = {
        type: "danger",
        message: "Erreur lors de la suppression de l'alerte",
      };
      res.redirect("/alerts");
    }
  }
);

module.exports = router;
