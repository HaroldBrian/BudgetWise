/* eslint-disable no-process-exit */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
require("dotenv").config();

const { sequelize } = require("./src/models");
const logger = require("./src/utils/logger");
const errorHandler = require("./src/middleware/errorHandler");
const sessionMiddleware = require("./src/middleware/sessionMiddleware");

// Import routes
const appRoutes = require("./src/routes/appRoutes");

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
    },
  })
);

// Global session middleware
app.use(sessionMiddleware);

// Middleware pour passer les messages flash aux vues
app.use((req, res, next) => {
  res.locals.message = req.session.message;
  res.locals.user = req.session.user;
  delete req.session.message;
  next();
});

// View engine
app.set("view engine", "ejs");

// Routes
app.use(appRoutes);

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
