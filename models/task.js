"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
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
    }
  }
  Task.init(
    {
      projectId: DataTypes.INTEGER,
      task: DataTypes.STRING,
      seq: DataTypes.INTEGER,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Task",
    }
  );
  return Task;
};
