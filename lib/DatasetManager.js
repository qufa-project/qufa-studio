const { v4: uuidv4 } = require("uuid");
const { Dataset, Meta } = require("../models");

const MetaManager = require("./MetaManager");
const FileManager = require("./FileManager");
const RawDataManager = require("./RawDataManager");

async function find(id) {
  return await Dataset.findByPk(id);
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

  const metaList = await MetaManager.createAll(dataset, meta);
  const s3Res = await FileManager.uploadFile(dataset.id, fileName, file);
  dataset.remotePath = `${s3Res}`;
  await dataset.save();

  await RawDataManager.makeDataTable(dataset.dataTable, metaList);

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

module.exports = {
  find,
  create,
  findWithMeta,
};
