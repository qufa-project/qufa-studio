"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Data extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Meta);
    }
  }
  Data.init(
    {
      name: DataTypes.STRING,
      contentType: DataTypes.STRING,
      fileSize: DataTypes.BIGINT,
      remotePath: DataTypes.STRING,
      originFileName: DataTypes.STRING,
      dataTable: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Data",
      tableName: "Data",
      underscored: true,
    }
  );
  return Data;
};
