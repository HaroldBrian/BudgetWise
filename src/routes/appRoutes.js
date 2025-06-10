const express = require("express");
const indexRoutes = require("./index");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const budgetRoutes = require("./budgets");
const transactionRoutes = require("./transactions");
const alertRoutes = require("./alerts");
const reportRoutes = require("./reports");

const router = express.Router();

router.use("/", indexRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/budgets", budgetRoutes);
router.use("/api/transactions", transactionRoutes);
router.use("/api/alerts", alertRoutes);
router.use("/api/reports", reportRoutes);

// Routes pour les pages
router.use("/budgets", budgetRoutes);
router.use("/transactions", transactionRoutes);
router.use("/alerts", alertRoutes);
router.use("/reports", reportRoutes);
router.use("/users", userRoutes);

module.exports = router;