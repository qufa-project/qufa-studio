"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const TASK_STATUS = {
    init: { stat: "init", message: "Init" },
    processing: { stat: "processing", message: "Processing" },
    save_data: { stat: "save_data", message: "Saving" },
    profiling: { stat: "profiling", message: "Profiling" },
    importance: { stat: "importance", message: "Analyzing" },
    done: { stat: "done", message: "Complete" },
    error: { stat: "error", message: "Error" },
  };

  const TASKS = {
    outlier: "Outlier Removal",
    imputation: "Data Imputation",
    feature: "Feature Engineering",
    fairness: "Fairness Improvement",
    dimReduction: "차원축소",
  };

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

      this.hasOne(models.Dataset, { as: "dataset", foreignKey: "task_id" });
    }

    static get status() {
      return TASK_STATUS;
    }

    static get tasks() {
      return TASKS;
    }

    isSaveData() {
      return ["profiling", "importance", "done"].indexOf(this.status) > 0;
    }

    getStatusMsg() {
      return TASK_STATUS[this.status].message;
    }

    getTaskMsg() {
      return TASKS[this.task];
    }

    async setDone() {
      this.status = TASK_STATUS.done.stat;
      await this.save();
    }
  }
  Task.init(
    {
      projectId: DataTypes.INTEGER,
      task: DataTypes.STRING,
      seq: DataTypes.INTEGER,
      status: DataTypes.STRING,
      dataTable: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Task",
      tableName: "Tasks",
      underscored: true,
    }
  );
  return Task;
};
