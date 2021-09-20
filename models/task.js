"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const TASK_STATUS = {
    init: { stat: "init", message: "요청중" },
    processing: { stat: "processing", message: "태스크 진행중" },
    done: { stat: "done", message: "처리완료" },
    error: { stat: "error", message: "오류" },
  };

  const TASKS = {
    outlier: "이상치 제거",
    imputation: "결측치 보완",
    feature: "특징추출",
    fairness: "공정성",
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
    }

    static get status() {
      return TASK_STATUS;
    }

    static get tasks() {
      return TASKS;
    }

    getStatusMsg() {
      return TASK_STATUS[this.status].message;
    }

    getTaskMsg() {
      return TASKS[this.task];
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
      tableName: "Tasks",
      underscored: true,
    }
  );
  return Task;
};
