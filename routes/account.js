const router = require("express").Router();
const {
  authenticate,
  authorize,
  PRIVILEGE,
} = require("../lib/security/accesscontrol");

router.get("/", authorize(PRIVILEGE.NORMAL), (req, res, next) => {
  res.render("./account/index.ejs");
});

router.use(
  "/reviews",
  authorize(PRIVILEGE.NORMAL),
  require("./account.reviews.js")
);

router.get("/login", (req, res, next) => {
  res.render("./account/login.ejs", { message: req.flash("message") });
});

router.post("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/account/login");
});

router.post("/login", authenticate());

module.exports = router;
