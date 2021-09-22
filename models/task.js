"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const TASK_STATUS = {
    init: { stat: "init", message: "요청중" },
    processing: { stat: "processing", message: "태스크 진행중" },
    save_data: { stat: "save_data", message: "결과 데이터 저장중" },
    profiling: { stat: "profiling", message: "프로파일링 진행중" },
    importance: { stat: "importance", message: "중요도분석" },
    done: { stat: "done", message: "완료" },
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

      this.hasOne(models.Dataset, { as: "dataset", foreignKey: "task_id" });
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
