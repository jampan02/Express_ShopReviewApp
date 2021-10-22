const router = require("express").Router();
const { MySQLClient, sql } = require("../lib/database/client.js");
router.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  Promise.all([
    MySQLClient.executeQuery(await sql("SELECT_SHOP_DETAIL_BY_ID"), [id]),
    MySQLClient.executeQuery(await sql("SELECT_SHOP_REVIEW_BY_SHOP_ID"), [id]),
  ])
    .then((results) => {
      let data = results[0][0];
      data.reviews = results[1] || [];
      console.log(data);
      res.render("./shops/index.ejs", data);
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = router;
