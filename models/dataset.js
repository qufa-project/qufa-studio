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

      this.belongsTo(models.Task, {
        as: "task",
        foreignKey: "task_id",
      });

      this.hasMany(models.Meta, { as: "metas", foreignKey: "dataset_id" });
      this.hasMany(models.MkFeature, {
        as: "features",
        foreignKey: "dataset_id",
      });
    }

    static get status() {
      return DATA_STATUS;
    }

    static get processTypes() {
      return DATASET_PROCESS_TYPES;
    }

    getFeatureUrl() {
      return `s3://qufa-test/${this.getFeaturePath()}`;
    }

    getFeaturePath() {
      if (this.remotePath) {
        const pureFileName = this.remotePath
          .replace(/^.*[\\\/]/, "")
          .replace(/\.[^/.]+$/, "");

        return `mkfeat/feature/${this.id}/${pureFileName}_feature.csv`;
      }
    }

    getFairnessDomain() {
      if (this.remotePath.indexOf("health2") > -1) {
        return "health2";
      } else if (this.remotePath.indexOf("health") > -1) {
        return "health";
      } else {
        return "traffic";
      }
    }

    getFairnessResultPath() {
      if (this.getFairnessDomain() == "health") {
        return `fairness/health_after.csv`;
      } else if (this.getFairnessDomain() == "health2") {
        return `fairness/health2_after.csv`;
      } else {
        return `fairness/traffic_after.csv`;
      }
    }

    getFairnessDataJson(isBefore) {
      let dataTerm = "before";
      if (!isBefore) {
        dataTerm = "after";
      }

      return `fairness/sunburst/${this.getFairnessDomain()}.${dataTerm}.json`;
    }

    getFairnessResultJson() {
      if (this.getFairnessDomain() == "health") {
        return `fairness/json/health_result.json`;
      } else if (this.getFairnessDomain() == "health2") {
        return `fairness/json/health_result2.json`;
      } else {
        return `fairness/json/traffic_result.json`;
      }
    }

    getResultJson() {
      if (this.remotePath) {
        let pos = this.remotePath.lastIndexOf(".");
        return (
          this.remotePath.substr(0, pos < 0 ? this.remotePath.length : pos) +
          ".json"
        );
      }

      return null;
    }

    getImputationResultPath(isDataFile) {
      if (this.remotePath) {
        const pureFileName = this.remotePath
          .replace(/^.*[\\\/]/, "")
          .replace(/\.[^/.]+$/, "");

        if (isDataFile) {
          return `imputation/impute/${this.id}/${pureFileName}/result.csv`;
        } else {
          return `imputation/impute/${this.id}/${pureFileName}/result.json`;
        }
      }

      return null;
    }

    getOutlierResultPath(isDataFile) {
      if (this.remotePath) {
        const pureFileName = this.remotePath
          .replace(/^.*[\\\/]/, "")
          .replace(/\.[^/.]+$/, "");

        if (isDataFile) {
          return `imputation/outlier/${this.id}/${pureFileName}/result.csv`;
        } else {
          return `imputation/outlier/${this.id}/${pureFileName}/result.json`;
        }
      }

      return null;
    }

    getDimResuctionPath() {
      if (this.remotePath) {
        const pureFileName = this.remotePath
          .replace(/^.*[\\\/]/, "")
          .replace(/\.[^/.]+$/, "");

        return `fairness/dimReduction/${this.id}/${pureFileName}.csv`;
      }
    }
  }
  Dataset.init(
    {
      projectId: DataTypes.INTEGER,
      taskId: DataTypes.INTEGER,
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
