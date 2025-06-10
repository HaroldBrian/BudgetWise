const sessionMiddleware = (req, res, next) => {
  // Rendre les variables de session disponibles dans toutes les vues
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.message = req.session.message || null;
  res.locals.error = req.session.error || null;

  // Nettoyer les messages après les avoir rendus disponibles
  delete req.session.message;
  delete req.session.error;

  next();
};

module.exports = sessionMiddleware;
