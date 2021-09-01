"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Meta extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Data, { foreignKey: "data_id" });

      this.hasMany(models.Importance, {
        as: "targets",
        foreignKey: "target_id",
      });
      this.hasMany(models.Importance, {
        as: "features",
        foreignKey: "feature_id",
      });
    }
  }
  Meta.init(
    {
      dataId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      koName: DataTypes.STRING,
      colType: DataTypes.STRING,
      maxLength: DataTypes.INTEGER,
      floatLength: DataTypes.INTEGER,
      dateFormat: DataTypes.STRING,
      trueValue: DataTypes.STRING,
      isNotNull: DataTypes.BOOLEAN,
      isUnique: DataTypes.BOOLEAN,
      isIndex: DataTypes.BOOLEAN,
      colSeq: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Meta",
      tableName: "Meta",
      underscored: true,
    }
  );
  return Meta;
};
