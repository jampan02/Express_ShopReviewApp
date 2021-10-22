const passport = require("passport");
const {
  //時間制限
  ACCOUNT_LOCK_WINDOW,
  //失敗していい回数
  ACCOUNT_LOCK_THRESHOLD,
  //ロックされる時間
  ACCOUNT_LOCK_TIME,
  MAX_LOGIN_HISTORY,
} = require("../../config/application.config");
const moment = require("moment");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const { MySQLClient, sql } = require("../database/client");
const PRIVILEGE = {
  NORMAL: "normal",
};
const LOGIN_STATUS = {
  SUCCESS: 0,
  FAILURE: 1,
};
var initialize, authenticate, authorize;
initialize = () => {
  return [
    passport.initialize(),
    passport.session(),
    (req, res, next) => {
      if (req.user) {
        res.locals.user = req.user;
      }
      next();
    },
  ];
};
//こいつがセッションにいれる
passport.serializeUser((user, done) => {
  done(null, user);
});
//こいつがreq.userにいれる（みんなつかえる）
passport.deserializeUser((user, done) => {
  done(null, user);
});

//二番目にこいつ
passport.use(
  "local-strategy",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      var transaction, results, user, count;
      var now = new Date();
      try {
        transaction = await MySQLClient.biginTransaction();
        //ユーザー情報取得
        results = await transaction.executeQuery(
          await sql("SELECT_USER_BY_EMAIL_FOR_UPDATE"),
          [username]
        );
        //存在確認
        if (results.length !== 1) {
          transaction.commit();
          return done(
            null,
            false,
            req.flash("message", "ユーザー名またはパスワードが間違っています")
          );
        }
        //ユーザー変数入れる
        user = {
          id: results[0].id,
          name: results[0].name,
          email: results[0].email,
          permissions: [PRIVILEGE.NORMAL],
        };
        //ロックされてるか調べる
        //ロックされてから一時間はtrueを返す（ロック状態にする）
        if (
          results[0].locked &&
          moment(now).isSameOrBefore(
            moment(results[0].locked).add(ACCOUNT_LOCK_TIME, "minutes")
          )
        ) {
          transaction.commit();
          return done(
            null,
            false,
            req.flash("message", "アカウントがロックされています。")
          );
        }
        //delete login log
        await transaction.executeQuery(await sql("DELETE_LOGIN_HISTORY"), [
          user.id,
          user.id,
          MAX_LOGIN_HISTORY - 1,
        ]);
        //compare pass
        if (!(await bcrypt.compare(password, results[0].password))) {
          //insert loing
          await transaction.executeQuery(await sql("INSERT_LOGIN_HISTORY"), [
            user.id,
            now,
            LOGIN_STATUS.FAILURE,
          ]);
          //ロックする（超えたら）
          //ロック回数調べる
          let tmp = await transaction.executeQuery(
            await sql("COUNT_LOGIN_HISTORY"),
            [
              user.id,
              moment(now).subtract(ACCOUNT_LOCK_WINDOW, "minutes").toDate(),
              LOGIN_STATUS.FAILURE,
            ]
          );
          count = (tmp || [])[0].count;
          //ロック処理
          if (count >= ACCOUNT_LOCK_THRESHOLD) {
            await transaction.executeQuery(await sql("UPDATE_USER_LOCKED"), [
              now,
              user.id,
            ]);
          }
          transaction.commit();
          return done(
            null,
            false,
            req.flash("message", "ユーザー名またはパスワードが間違っています")
          );
        }
        //insert loing
        await transaction.executeQuery(await sql("INSERT_LOGIN_HISTORY"), [
          user.id,
          now,
          LOGIN_STATUS.SUCCESS,
        ]);
        //ロック解除
        await transaction.executeQuery(await sql("UPDATE_USER_LOCKED"), [
          null,
          user.id,
        ]);
        transaction.commit();
      } catch (err) {
        transaction.rollback();
        return done(err);
      }

      //sesion regenerate
      req.session.regenerate((err) => {
        if (err) {
          done(err);
        } else {
          done(null, user);
        }
      });
    }
  )
);

//最初にこいつ
authenticate = () => {
  return passport.authenticate("local-strategy", {
    successRedirect: "/account",
    failureRedirect: "/account/login",
  });
};

authorize = (privilege) => {
  return (req, res, next) => {
    if (
      req.isAuthenticated() &&
      (req.user.permissions || []).indexOf(privilege) >= 0
    ) {
      next();
    } else {
      res.redirect("/account/login");
    }
  };
};

module.exports = {
  initialize,
  authenticate,
  authorize,
  PRIVILEGE,
};
