const path = require("path");
const { sql } = require("@garafu/mysql-fileloader")({
  root: path.join(__dirname, "./sql"),
});
const Transaction = require("./transaction");
const pool = require("./pool");
const MySQLClient = {
  executeQuery: async (query, values) => {
    var results = await pool.executeQuery(query, values);
    return results;
  },
  biginTransaction: async () => {
    var tran = new Transaction();
    await tran.begin();
    return tran;
  },
};
module.exports = { MySQLClient, sql };
