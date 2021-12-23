module.exports = {
  development: {
    username: process.env.QUFA_DB_USER,
    password: process.env.QUFA_DB_PASSWORD,
    database: process.env.QUFA_DB_DATABASE,
    host: process.env.QUFA_DB_HOST,
    dialect: "mysql",
  },
  test: {
    username: process.env.QUFA_DB_USER,
    password: process.env.QUFA_DB_PASSWORD,
    database: process.env.QUFA_DB_DATABASE,
    host: process.env.QUFA_DB_HOST,
    dialect: "mysql",
  },
  production: {
    username: process.env.QUFA_DB_USER,
    password: process.env.QUFA_DB_PASSWORD,
    database: process.env.QUFA_DB_DATABASE,
    host: process.env.QUFA_DB_HOST,
    dialect: "mysql",
  },
};
