const config = require("../configs/config");

const { Project, Task, Dataset, Meta, MkFeature } = require("../models");

const ProjectService = require("./ProjectService");
const DatasetService = require("./DatasetService");
const ColstatService = require("./ColstatService");

const DatasetManager = require("../lib/DatasetManager");
const FileManager = require("../lib/FileManager");
const MetaManager = require("../lib/MetaManager");
const ImputationManager = require("../lib/ImputationManager");
const ProfileManager = require("../lib/ProfileManager");
const FairnessManager = require("../lib/FairnessManager");
const DimReductionManager = require("../lib/DimReductionManager");
const ChildProcessManager = require("../lib/ChildProcessManager");

const MkfeatManager = require("../lib/MkfeatManager");
const mkfeatUrl = config.mkfeat.url;
const mkfeatManager = new MkfeatManager({ endpoint: mkfeatUrl });

const projectService = new ProjectService();
const datasetService = new DatasetService();
const colstatService = new ColstatService();

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

  async prevTask(projectId, seq) {
    const prevTask = await Task.findOne({
      where: {
        projectId,
        seq,
      },
      order: ["seq"],
    });

    return prevTask;
  }

  async runTask() {
    const nextTask = await this.nextTask();
    if (nextTask) {
      nextTask.status = Task.status.processing.stat;

      let dataset = null;
      dataset = await datasetService.findOriginByProject(nextTask.projectId);
      /*
      if (nextTask.seq == 1) {
        dataset = await datasetService.findOriginByProject(nextTask.projectId);
      } else {
        const prevTask = await this.prevTask(
          nextTask.projectId,
          nextTask.seq - 1
        );

        if (prevTask.isSaveData()) {
          dataset = await datasetService.findByTaskId(prevTask.id);
        }
      }
      */

      if (!dataset) {
        // task 작업은 선행 작업의 결과물을 바탕으로 수행. 선행작업의 데이터가 존재하지 않을경우 이후 작업은 무시됨
        return false;
      }

      const taskDataset = await Dataset.create({
        projectId: nextTask.projectId,
        taskId: nextTask.id,
      });
      await nextTask.save();

      const taskName = nextTask.task;

      switch (taskName) {
        case "outlier":
          await ImputationManager.runOutlier(dataset.remotePath);
          break;
        case "imputation":
          await ImputationManager.runImputation(dataset.remotePath);
          break;
        case "dimReduction":
          await DimReductionManager.runDimReduction(dataset.remotePath);
          break;
        case "fairness":
          await FairnessManager.runFairness(dataset);
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
          console.log(extractData);

          const mkExtractCallBack = async (progress) => {
            console.log(`Mkfeat progress: ${progress}`);
          };

          const mkFeatures = await mkfeatManager.batchExtractJob(
            dataset,
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
        case "fairness":
          taskFilePath = originDataset.getFairnessResultPath();
          break;
        case "feature":
          isOriginScheme = false;
          taskFilePath = originDataset.getFeaturePath();
          break;
        case "dimReduction":
          isOriginScheme = false;
          taskFilePath = originDataset.getDimResuctionPath();
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

        if (isOriginScheme) {
          await datasetService.cloneMeta(originDataset.id, dataset.id);
        } else {
          const encoding = await MetaManager.detectEncoding(dataset.remotePath);
          const records = await MetaManager.parseRecord(dataset, {
            encoding,
          });
          const metas = MetaManager.extractMeta(records, 1);
          await datasetService.createMetas(dataset, metas);
        }
        ChildProcessManager.runS3CsvParser(dataset);

        task.status = Task.status.save_data.stat;
        await task.save();
      } catch (err) {
        console.error("runPostTask Exception >>>>>>>>>>>>>>>>>>>>>>>>");
        // console.error(err);
      }

      return task;
    } else {
      return null;
    }
  }

  async checkProfiling() {
    const task = await Task.findOne({
      where: { status: Task.status.profiling.stat },
      include: [
        {
          model: Dataset,
          as: "dataset",
          required: true,
        },
      ],
    });

    if (task && task.dataset) {
      const dataset = task.dataset;

      try {
        const profileResult = await ProfileManager.findProfileResult(dataset);
        if (profileResult && profileResult.status == "SUCCESS") {
          dataset.hasProfile = true;
          await dataset.save();

          console.log(task.task);
          if (task.task == "fairness") {
            await colstatService.calcColStat(task.projectId);
          }

          await task.setDone();

          return task;
        }
      } catch (err) {
        console.error(err);
        return null;
      }
    }

    return null;
  }
}

module.exports = TaskService;
