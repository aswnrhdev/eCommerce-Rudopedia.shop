const User = require("../models/userModel");

const isBlocked = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const user = await User.findById({ _id: req.session.user_id });
      if (user.is_blocked) {
        res.status(403).render("users/404");
      } else {
        next();
      }
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

module.exports = {
  isBlocked,
};
