const { v4: uuidv4 } = require("uuid");
const { Task, Dataset, Meta, MkFeature, Importance } = require("../models");

const MetaManager = require("./MetaManager");
const FileManager = require("./FileManager");
const RawDataManager = require("./RawDataManager");

// TODO: 향후 service와 manager 역할에 따른 분리 필요
async function find(id) {
  return await Dataset.findByPk(id);
}

async function findWithTask(id) {
  return await Dataset.findOne({
    where: { id },
    include: [
      {
        model: Task,
        as: "task",
      },
    ],
  });
}

async function create(projectId, meta, file) {
  const fileName = `${new Date().getTime()}_${file.originalname}`;

  const dataTableName = await genTableName();

  const dataset = Dataset.build({
    projectId,
    name: fileName,
    dataTable: dataTableName,
    contentType: file.mimetype,
    fileSize: file.size,
    originFileName: file.originalname,
    status: Dataset.status.init.stat,
    processType: Dataset.processTypes.origin,
    step: 1,
  });

  await dataset.save();

  console.log("Begin Extract Meta & Generate Schema ========================");
  const startDate = new Date();
  const metaList = await MetaManager.createAll(dataset, meta);
  const s3Res = await FileManager.uploadFile(dataset.id, fileName, file);
  dataset.remotePath = `${s3Res}`;
  await dataset.save();

  await RawDataManager.makeDataTable(dataset.dataTable, metaList);
  const endDate = new Date();
  const seconds = (endDate.getTime() - startDate.getTime()) / 1000;
  console.log(
    `End Extract Meta & Generate Schema: ${seconds} seconds ========================`
  );

  return dataset;
}

async function genTableName() {
  while (1) {
    const uuid = uuidv4();
    const dataset = await Dataset.findOne({ where: { name: uuid } });

    if (!dataset) {
      return uuid;
    }
  }
}

async function findWithMeta(id) {
  const dataset = await Dataset.findOne({
    where: { id: id },
    include: [
      {
        model: Meta,
        as: "metas",
      },
    ],
  });

  return dataset;
}

async function findWithFeatures(id) {
  const data = await Dataset.findOne({
    where: { id: id },
    include: [
      {
        model: MkFeature,
        as: "features",
      },
    ],
  });

  return data;
}

async function findWithImportance(id) {
  const data = await Dataset.findOne({
    where: { id: id },
    include: [
      {
        model: Meta,
        as: "metas",
        include: [
          {
            model: Importance,
            as: "targets",
          },
        ],
      },
    ],
  });

  return data;
}

module.exports = {
  find,
  findWithTask,
  create,
  findWithMeta,
  findWithFeatures,
  findWithImportance,
  genTableName,
};
