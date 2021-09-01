const { v4: uuidv4 } = require("uuid");
const { Data, Meta, MkFeature, Importance } = require("../models");
const pool = require("../db/pool");

const DATA_DEFAULT_PER_PAGE = 10;

const DATA_STATUS = {
  init: { stat: "init", message: "등록요청" },
  processing: { stat: "processing", message: "파일처리중" },
  done: { stat: "done", message: "등록완료" },
  error: { stat: "error", message: "오류" },
};

async function find(id) {
  return await Data.findByPk(id);
}

async function findAll(options) {
  options.perPage = options.perPage || DATA_DEFAULT_PER_PAGE;
  const offset = (options.currentPage - 1) * options.perPage;

  return await Data.findAndCountAll({
    offset: offset,
    limit: options.perPage,
    order: [["id", "DESC"]],
  });
}

async function findWithMeta(id) {
  const data = await Data.findOne({
    where: { id: id },
    include: [
      {
        model: Meta,
        as: "metas",
      },
    ],
  });

  return data;
}

async function findWithFeatures(id) {
  const data = await Data.findOne({
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
  const data = await Data.findOne({
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

async function create(fileName, file) {
  const dataTableName = await genTableName();

  const data = Data.build({
    name: fileName,
    dataTable: dataTableName,
    contentType: file.mimetype,
    fileSize: file.size,
    originFileName: file.originalname,
    status: DATA_STATUS.init.stat,
  });

  await data.save();

  return data;
}

async function genTableName() {
  while (1) {
    const uuid = uuidv4();
    const data = await Data.findOne({ where: { name: uuid } });

    if (!data) {
      return uuid;
    }
  }
}

module.exports = {
  DATA_STATUS,
  find,
  findAll,
  findWithMeta,
  findWithFeatures,
  findWithImportance,
  create,
  genTableName,
};
