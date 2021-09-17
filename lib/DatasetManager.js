const { v4: uuidv4 } = require("uuid");
const { Dataset } = require("../models");

const MetaManager = require("./MetaManager");
const FileManager = require("./FileManager");
const RawDataManager = require("./RawDataManager");

const DATA_STATUS = {
  init: { stat: "init", message: "등록요청" },
  processing: { stat: "processing", message: "파일처리중" },
  done: { stat: "done", message: "등록완료" },
  error: { stat: "error", message: "오류" },
};

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
    status: DATA_STATUS.init.stat,
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

module.exports = {
  DATA_STATUS,
  create,
};
