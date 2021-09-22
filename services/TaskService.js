const config = require("../configs/config");

const { Project, Task, Dataset, Meta, MkFeature } = require("../models");

const ProjectService = require("./ProjectService");
const DatasetService = require("./DatasetService");

const DatasetManager = require("../lib/DatasetManager");
const FileManager = require("../lib/FileManager");
const ImputationManager = require("../lib/ImputationManager");
const ChildProcessManager = require("../lib/ChildProcessManager");

const MkfeatManager = require("../lib/MkfeatManager");
const mkfeatUrl = config.mkfeat.url;
const mkfeatManager = new MkfeatManager({ endpoint: mkfeatUrl });

const projectService = new ProjectService();
const datasetService = new DatasetService();

/**
 * Task 처리 Service
 * 1. init 상태의 task 추출
 *  - processing 태스크가 존재하지 않을 경우.
 *  - processing 상태로 변경 이후 task 수행
 * 2. Post task 처리
 *  - process의 완료 여부는 S3 등록 여부로 판정
 *  - S3 등록 완료 된 경우 Download 및 데이터 처리 수행
 *  - Profiling 요청 및 Task 상태 변경
 */
class TaskService {
  async findWithDataset(id) {
    const task = await Task.findOne({
      where: { id },
      include: [
        {
          model: Dataset,
          as: "dataset",
          include: [
            {
              model: Meta,
              as: "metas",
            },
          ],
        },
      ],
    });

    return task;
  }

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

      const taskDataset = await Dataset.create({
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
        case "feature":
          const extractData = {
            data: {
              uri: `s3://qufa-test/${dataset.remotePath}`,
              columns: dataset.metas.map((el) => {
                return {
                  name: el.name,
                  type: el.colType,
                };
              }),
            },
            operator: [],
          };

          const mkExtractCallBack = async (progress) => {
            console.log(`Mkfeat progress: ${progress}`);
            dataset.mkfeatProgress = progress;
            await dataset.save();
          };

          const mkFeatures = await mkfeatManager.batchExtractJob(
            extractData,
            mkExtractCallBack
          );

          const featuresForBulkInsert = mkFeatures.map((el) => {
            return {
              datasetId: taskDataset.id,
              name: el.name,
              colType: el.type,
            };
          });

          await MkFeature.bulkCreate(featuresForBulkInsert);

          break;
      }
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
        if (isOriginScheme) {
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

          ChildProcessManager.runS3CsvParser(dataset, {});
        }

        task.status = Task.status.save_data.stat;
        await task.save();
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
