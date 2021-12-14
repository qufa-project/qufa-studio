const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../configs/db.config.json")[env];
config.username = process.env.QUFA_DB_USER || config.username;
config.password = process.env.QUFA_DB_PASSWORD || config.password;
config.database = process.env.QUFA_DB_DATABASE || config.database;
config.host = process.env.QUFA_DB_HOST || config.host;
config.dialect = process.env.QUFA_DB_DIALECT || "mysql";
config.port = process.env.QUFA_DB_PORT || 3306;

const initSession = (app) => {
  const options = {
    host: config.host | "localhost",
    port: config.port | 3306,
    user: config.username,
    password: config.password,
    database: config.database,
  };

  const sessionStore = new MySQLStore(options);
  app.use(
    session({
      name: "mysession",
      secret: "qwer1234",
      resave: true,
      store: sessionStore,
      saveUninitialized: false,
    })
  );
};

module.exports = initSession;
