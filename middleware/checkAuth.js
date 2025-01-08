module.exports = {
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/auth/login");
  },
  forwardAuthenticated: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/reminders");
  },
  isAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user.role == "admin") {
      return next();
    }
    res.redirect("/reminders");
  }
};
