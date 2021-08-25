// get the client
const mysql = require("mysql2/promise");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../configs/db.config.json")[env];

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool(config);

module.exports = pool;
