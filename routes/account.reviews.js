const router = require("express").Router();
const { MySQLClient, sql } = require("../lib/database/client");
const moment = require("moment");
const tokens = new (require("csrf"))();
const DATE_FORMAT = "YYYY/MM/DD";
var createReviewData = (req) => {
  var body = req.body;
  var date;
  return {
    shopId: req.params.shopId,
    score: parseInt(body.score),
    visit:
      (date = moment(body.visit, DATE_FORMAT)) && date.isValid()
        ? date.toDate()
        : null,
    post: new Date(),
    description: body.description,
  };
};
var validateReviewError = (req) => {
  var body = req.body;
  var isValid = true,
    error = {};
  if (body.visit && !moment(body.visit, DATE_FORMAT).isValid()) {
    isValid = false;
    error.visit = "訪問日の日付文字列が不正です";
  }
  if (isValid) {
    return undefined;
  }
  return error;
};

router.get("/regist/:shopId(\\d+)", async (req, res, next) => {
  var shopId = req.params.shopId;
  var secret, token, shop, shopName, review, results;
  secret = await tokens.secret();
  token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie("_csrf", token);

  try {
    results = await MySQLClient.executeQuery(
      await sql("SELECT_SHOP_BASIC_BY_ID"),
      [shopId]
    );
    shop = results[0] || {};
    shopName = shop.name;
    review = {};
  } catch (err) {
    next(err);
  }
  res.render("./account/reviews/regist-form.ejs", { shopId, shopName, review });
});

//「確認」画面行くためのヤツ
router.post("/regist/confirm", (req, res, next) => {
  var error = validateReviewError(req);
  var review = createReviewData(req);
  var { shopId, shopName } = req.body;
  if (error) {
    res.render("./account/reviews/regist-form.ejs", {
      error,
      shopId,
      shopName,
      review,
    });
    return;
  }
  res.render("./account/reviews/regist-confirm.ejs", {
    shopId,
    shopName,
    review,
  });
});
//「修正」押して戻るやつ
router.post("/regist/:shopId(\\d+)", (req, res, next) => {
  var review = createReviewData(req);
  var { shopId, shopName } = req.body;
  res.render("./account/reviews/regist-form.ejs", {
    shopId,
    shopName,
    review,
  });
});

router.post("/regist/execute", async (req, res, next) => {
  var secret = req.session._csrf;
  var token = req.cookies._csrf;
  if (tokens.verify(secret, token) === false) {
    next(new Error("Invalid Token"));
  }
  console.log("called");
  var error = validateReviewError(req);
  var review = createReviewData(req);
  var { shopId, shopName } = req.body;

  var userId = 1; //TODO:ログイン機能実装後に更新
  var transaction;
  if (error) {
    res.render("./account/reviews/regist-form.ejs", {
      error,
      shopId,
      shopName,
      review,
    });
    return;
  }
  try {
    transaction = await MySQLClient.biginTransaction();
    transaction.executeQuery(await sql("SELECT_SHOP_BY_ID_FOR_UPDATE"), [
      shopId,
    ]);
    transaction.executeQuery(await sql("INSERT_SHOP_REVIEW"), [
      Number(shopId),
      userId,
      review.score,
      review.visit,
      review.description,
      review.post,
    ]);
    transaction.executeQuery(await sql("UPDATE_SHOP_SCORE_BY_ID"), [
      shopId,
      shopId,
    ]);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    next(err);
    return;
  }
  delete req.session._csrf;
  res.clearCookie("_csrf");
  res.redirect(`/account/reviews/regist/complete?shopId=${shopId}`);
});

router.get("/regist/complete", (req, res, next) => {
  res.render("./account/reviews/regist-complate.ejs", {
    shopId: req.query.shopId,
  });
});

module.exports = router;
