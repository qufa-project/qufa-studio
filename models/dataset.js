"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const DATA_STATUS = {
    init: { stat: "init", message: "등록요청" },
    processing: { stat: "processing", message: "파일처리중" },
    done: { stat: "done", message: "등록완료" },
    error: { stat: "error", message: "오류" },
  };

  const DATASET_PROCESS_TYPES = {
    origin: "origin",
    imputation: "imputation",
    outlier: "outlier",
    feature: "feature",
    fairness: "fairness",
  };

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

    static get status() {
      return DATA_STATUS;
    }

    static get processTypes() {
      return DATASET_PROCESS_TYPES;
    }

    getImputationResultPath() {
      if (this.remotePath) {
        const pureFileName = this.remotePath
          .replace(/^.*[\\\/]/, "")
          .replace(/\.[^/.]+$/, "");

        return `imputation/impute/${this.id}/${pureFileName}/result.json`;
      }

      return null;
    }

    getOutlierResultPath() {
      if (this.remotePath) {
        const pureFileName = this.remotePath
          .replace(/^.*[\\\/]/, "")
          .replace(/\.[^/.]+$/, "");

        return `imputation/outlier/${this.id}/${pureFileName}/result.json`;
      }

      return null;
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
      processType: DataTypes.STRING,
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
