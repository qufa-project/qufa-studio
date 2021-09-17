"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Dataset extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Project, {
        as: "project",
        foreignKey: "project_id",
      });

      this.hasMany(models.Meta, { as: "metas", foreignKey: "dataset_id" });
    }
  }
  Dataset.init(
    {
      projectId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      contentType: DataTypes.STRING,
      fileSize: DataTypes.BIGINT,
      remotePath: DataTypes.STRING,
      originFileName: DataTypes.STRING,
      dataTable: DataTypes.STRING,
      step: DataTypes.INTEGER,
      status: DataTypes.STRING,
      hasProfile: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Dataset",
      tableName: "Datasets",
      underscored: true,
    }
  );
  return Dataset;
};
