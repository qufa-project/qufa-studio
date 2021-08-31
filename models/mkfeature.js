'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MkFeature extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Data, { foreignKey: "data_id" });
    }
  };
  MkFeature.init({
    dataId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    colType: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'MkFeature',
    tableName: "MkFeature",
    underscored: true,
  });
  return MkFeature;
};