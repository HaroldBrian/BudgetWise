const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      message: "Non authentifié",
    });
  }
  req.session.message = {
    type: "warning",
    message: "Vous devez être connecté pour accéder à cette page",
  };
  res.redirect("/");
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect("/dashboard");
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
};
