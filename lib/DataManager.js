const { v4: uuidv4 } = require("uuid");
const { Data, Meta } = require("../models");
const pool = require("../db/pool");

const DATA_STATUS = {
  init: "init",
  processing: "processing",
  done: "done",
  error: "error",
};

async function find(id) {
  return await Data.findByPk(id);
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

async function create(fileName, file) {
  const dataTableName = await genTableName();

  const data = Data.build({
    name: fileName,
    dataTable: dataTableName,
    contentType: file.mimetype,
    fileSize: file.size,
    originFileName: file.originalname,
    status: DATA_STATUS.init,
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
  findWithMeta,
  create,
  genTableName,
};
