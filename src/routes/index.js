const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  isNotAuthenticated,
} = require("../middleware/authMiddleware");
const { Transaction } = require("../models");

// Page d'accueil
router.get("/", (req, res) => {
  res.render("index", {
    title: "Accueil",
    user: req.session.user,
  });
});

// Page tableau de bord
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    // Récupérer les transactions récentes
    const transactions = await Transaction.findAll({
      where: { userId: req.session.user.id },
      order: [["date", "DESC"]],
      limit: 5,
    });

    // Calculer les statistiques
    const balance = 0; // À implémenter
    const monthlyIncome = 0; // À implémenter
    const monthlyExpenses = 0; // À implémenter
    const remainingBudget = 0; // À implémenter

    res.render("dashboard/index", {
      title: "Tableau de bord",
      user: req.session.user,
      transactions,
      balance,
      monthlyIncome,
      monthlyExpenses,
      remainingBudget,
    });
  } catch (error) {
    console.error("Erreur lors du chargement du tableau de bord:", error);
    req.session.message = {
      type: "danger",
      message: "Une erreur est survenue lors du chargement du tableau de bord",
    };
    res.redirect("/");
  }
});

// Page de profil
router.get("/profile", isAuthenticated, (req, res) => {
  res.render("profile", {
    title: "Profil",
    user: req.session.user,
  });
});

module.exports = router;
