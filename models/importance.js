'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Importance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Meta, { foreignKey: "target_id" });
      this.belongsTo(models.Meta, { foreignKey: "feature_id" });
    }
  };
  Importance.init({
    targetId: DataTypes.INTEGER,
    featureId: DataTypes.INTEGER,
    importance: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: "Importance",
    tableName: "Importance",
    underscored: true,
  });
  return Importance;
};