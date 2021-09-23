"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Dataset, {
        as: "datasets",
        foreignKey: "project_id",
      });

      this.hasMany(models.Task, {
        as: "tasks",
        foreignKey: "project_id",
      });
    }

    originDataset(models) {
      // TODO: Dataset에 정의된 constant 활용
      return this.datasets.find((dataset) => {
        return dataset.processType === "origin";
      });
    }
  }
  Project.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      hasTasks: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Project",
      tableName: "Projects",
      underscored: true,
    }
  );
  return Project;
};
