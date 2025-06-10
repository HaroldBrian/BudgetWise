const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  isNotAuthenticated,
} = require("../middleware/authMiddleware");
const { Transaction, Budget } = require("../models");
const { Op } = require("sequelize");

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
    const userId = req.session.user.id;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Récupérer les transactions récentes
    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      order: [["date", "DESC"]],
      limit: 5,
    });

    // Récupérer toutes les transactions pour les calculs
    const allTransactions = await Transaction.findAll({
      where: { user_id: userId }
    });

    // Récupérer le budget du mois actuel
    const currentBudget = await Budget.findOne({
      where: { 
        user_id: userId,
        month: currentMonth
      }
    });

    // Calculer les statistiques
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = totalIncome - totalExpenses;

    // Statistiques du mois actuel
    const monthlyTransactions = allTransactions.filter(t => {
      const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
      return transactionMonth === currentMonth;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const remainingBudget = currentBudget ? 
      parseFloat(currentBudget.amount) - monthlyExpenses : 0;

    // Dépenses par catégorie
    const expensesByCategory = allTransactions
      .filter(t => t.type === 'expense' && t.category)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {});

    res.render("dashboard/index", {
      title: "Tableau de bord",
      user: req.session.user,
      transactions,
      balance: balance.toFixed(2),
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpenses: monthlyExpenses.toFixed(2),
      remainingBudget: remainingBudget.toFixed(2),
      currentBudget: currentBudget ? parseFloat(currentBudget.amount).toFixed(2) : 0,
      expensesByCategory,
      stats: {
        totalTransactions: allTransactions.length,
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2)
      }
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

module.exports = router;