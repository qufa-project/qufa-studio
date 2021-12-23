"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ColStat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  ColStat.init(
    {
      datasetId: DataTypes.INTEGER,
      colName: DataTypes.STRING,
      colValue: DataTypes.STRING,
      colCount: DataTypes.BIGINT,
      isOrigin: DataTypes.BOOLEAN,
      seq: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ColStat",
      tableName: "ColStats",
      underscored: true,
    }
  );

  return ColStat;
};
