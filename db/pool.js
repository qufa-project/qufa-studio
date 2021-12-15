// get the client
const mysql = require("mysql2/promise");
const env = process.env.NODE_ENV || "development";

const config = require(__dirname + "/../configs/data-db.config.json")[env];
config.user = process.env.QUFA_DATA_USER || config.user;
config.password = process.env.QUFA_DATA_PASSWORD || config.password;
config.database = process.env.QUFA_DATA_DATABASE || config.database;
config.host = process.env.QUFA_DATA_HOST || config.host;
config.dialect = process.env.QUFA_DATA_DIALECT || "mysql";
config.port = process.env.QUFA_DATA_PORT || config.port || 3306;

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool(config);

module.exports = pool;
