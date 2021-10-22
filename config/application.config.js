module.exports = {
  PORT: process.env.port || 3000,
  security: {
    SESSION_SECRET: "YOUR_SESSION_SECRET_STRING",
  },
  //時間制限
  ACCOUNT_LOCK_WINDOW: 30,
  //失敗していい回数
  ACCOUNT_LOCK_THRESHOLD: 5,
  //ロックされる時間
  ACCOUNT_LOCK_TIME: 60,
  MAX_LOGIN_HISTORY: 20,
  search: {
    MAX_ITEMS_PER_PAGE: 5,
  },
};
