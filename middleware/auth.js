const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      next();
    } else {
      res.redirect("/signin");
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/signin");
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/");
  }
};

module.exports = {
  isLogin,
  isLogout,
};
