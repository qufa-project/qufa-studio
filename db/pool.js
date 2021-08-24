// get the client
const mysql = require("mysql2/promise");
var config = require("../configs/config");

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool(config.db);

module.exports = pool;
