const IS_PRODUCTION = process.env.NODE_ENV === "production";
console.log(IS_PRODUCTION);
const appconfig = require("./config/application.config");
const dbConfig = require("./config/mysql.config");
const path = require("path");
const logger = require("./lib/log/logger.js");
const favicon = require("serve-favicon");
const cookie = require("cookie-parser");
const session = require("express-session");
const gracefulShutdown = require("http-graceful-shutdown");
const MySQLStore = require("express-mysql-session")(session);
const applicationLogger = require("./lib/log/applicationlogger.js");
const accesscontrol = require("./lib/security/accesscontrol");
const accessLogger = require("./lib/log/accesslogger");
const express = require("express");
const flash = require("connect-flash");
const app = express();

app.set("view engine", "ejs");
app.disable("x-powered-by");
//Expose global method to view engine
app.use((req, res, next) => {
  res.locals.moment = require("moment");
  res.locals.padding = require("./lib/math/math").padding;
  next();
});
app.use(favicon(path.join(__dirname, "/public/favicon.ico")));
//Static Resource Routin
app.use("/public", express.static(path.join(__dirname, "/public")));
//Set Access Log
app.use(accessLogger());
//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookie());
app.use(
  session({
    store: new MySQLStore({
      host: dbConfig.HOST,
      post: dbConfig.PORT,
      user: dbConfig.USERNAME,
      password: dbConfig.PASSWORD,
      database: dbConfig.DATABASE,
    }),
    cookie: {
      secure: false,
    },
    secret: appconfig.security.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sid",
  })
);
app.use(flash());
app.use(...accesscontrol.initialize());
//Dinamic Recource Routin

app.use((req, res, next) => {
  //保存されたクッキー取得して表示
  console.log(req.cookies.message);
  //クライアント側に保存させる
  res.cookie("message", "Hello World");

  next();
});
app.use(
  "/",
  (() => {
    const router = express.Router();
    router.use((req, res, next) => {
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      next();
    });
    router.use("/account", require("./routes/account.js"));
    router.use("/search", require("./routes/search.js"));
    router.use("/shops", require("./routes/shops.js"));
    router.use("/test", () => {
      throw new Error("test error ");
    });
    router.use("/", require("./routes/index.js"));
    return router;
  })()
);

//Set Application Logger
app.use(applicationLogger());

//cutom looger
app.use((req, res, next) => {
  res.status(404);
  res.render("./404.ejs");
});
app.use((err, req, res, next) => {
  res.status(500);
  res.render("./500.ejs");
});

// Exucuse Web App
var server = app.listen(appconfig.PORT, () => {
  logger.application.info("Aplication listnning to ", appconfig.PORT);
});

//gracefu lshutdonw
gracefulShutdown(server, {
  signals: "SIGINT SIGTERM",
  timeout: 10000,
  onShutdown: () => {
    return new Promise((resolve, reject) => {
      const { pool } = require("./lib/database/pool.js");
      pool.end((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  },
  finally: () => {
    const logger = require("./lib/log/logger").application;
    logger.info("Application shudown finished");
  },
});
