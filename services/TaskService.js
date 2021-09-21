const { Project, Task, Dataset } = require("../models");

const ProjectService = require("./ProjectService");
const DatasetService = require("./DatasetService");

const DatasetManager = require("../lib/DatasetManager");
const FileManager = require("../lib/FileManager");
const ImputationManager = require("../lib/ImputationManager");
const ChildProcessManager = require("../lib/ChildProcessManager");

const projectService = new ProjectService();
const datasetService = new DatasetService();

class TaskService {
  async nextTask() {
    const task = await Task.findOne({
      where: {
        status: "processing",
      },
    });

    if (task) {
      return null;
    }

    const nextTask = await Task.findOne({
      where: {
        status: "init",
      },
      order: ["id"],
    });

    return nextTask;
  }

  async runTask() {
    const nextTask = await this.nextTask();
    if (nextTask) {
      nextTask.status = Task.status.processing.stat;

      await Dataset.create({
        projectId: nextTask.projectId,
        taskId: nextTask.id,
      });

      await nextTask.save();

      const project = await projectService.findWithOriginDataset(
        nextTask.projectId
      );

      const dataset = project.datasets[0];
      const taskName = nextTask.task;

      switch (taskName) {
        case "outlier":
          await ImputationManager.runOutlier(dataset.remotePath);
          break;
        case "imputation":
          await ImputationManager.runImputation(dataset.remotePath);
          break;
      }
    } else {
    }

    return nextTask;
  }

  async runPostTask() {
    const task = await Task.findOne({
      where: {
        status: "processing",
      },
      include: [
        {
          model: Dataset,
          as: "dataset",
        },
      ],
      order: ["id"],
    });

    if (task) {
      const originDataset = await datasetService.findOriginByProject(
        task.projectId
      );

      const dataset = task.dataset;

      let taskFilePath = "";
      let isOriginScheme = true;

      switch (task.task) {
        case "outlier":
          taskFilePath = originDataset.getOutlierResultPath(true);
          break;
        case "imputation":
          taskFilePath = originDataset.getImputationResultPath(true);
          break;
        case "feature":
          isOriginScheme = false;
          break;
      }

      try {
        const s3Meta = await FileManager.findS3Meta(taskFilePath);

        dataset.name = taskFilePath;
        dataset.contentType = originDataset.contentType;
        dataset.fileSize = s3Meta.ContentLength;
        dataset.remotePath = taskFilePath;
        dataset.status = Dataset.status.init.stat;
        dataset.processType = task.task;
        dataset.dataTable = await DatasetManager.genTableName();
        await dataset.save();

        await datasetService.cloneMeta(originDataset.id, dataset.id);

        task.status = Task.status.save_data.stat;
        await task.save();

        ChildProcessManager.runS3CsvParser(dataset, {});
      } catch (err) {
        console.error(err);
      }

      return task;
    } else {
      return null;
    }
  }
}

module.exports = TaskService;
