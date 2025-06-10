/* eslint-disable no-process-exit */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const { sequelize } = require("./src/models");
const logger = require("./src/utils/logger");
const errorHandler = require("./src/middleware/errorHandler");

// Import routes
const indexRoutes = require("./src/routes/index");
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const budgetRoutes = require("./src/routes/budgets");
const transactionRoutes = require("./src/routes/transactions");
const alertRoutes = require("./src/routes/alerts");
const reportRoutes = require("./src/routes/reports");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Content Security Policy
// Note: pour autoriser l'utilisation des ressources de jsdelivr.net et CDN
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
      "style-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
      "font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
      "connect-src 'self';"
  );
  next();
});
// Logging middleware
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Body middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

// View engine
app.set("view engine", "ejs");

// Test check endpoint
app.get("/test", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use("/", indexRoutes);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established successfully");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      logger.info("Database synchronized");
    }

    app.listen(PORT, () => {
      logger.info(`BudgetWise server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
