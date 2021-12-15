"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../configs/db.config.json")[env];
config.username = process.env.QUFA_DB_USER || config.username;
config.password = process.env.QUFA_DB_PASSWORD || config.password;
config.database = process.env.QUFA_DB_DATABASE || config.database;
config.host = process.env.QUFA_DB_HOST || config.host;
config.dialect = process.env.QUFA_DB_DIALECT || "mysql";
config.port = process.env.QUFA_DB_PORT || config.port || 3306;
config.logging =
  process.env.QUFA_DB_LOGGING || config.logging || env == "development";

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
