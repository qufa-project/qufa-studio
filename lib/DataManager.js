const { v4: uuidv4 } = require("uuid");
const { Data } = require("../models");
const pool = require("../db/pool");

const DATA_TYPE_MAP = {
  number: "DECIMAL",
  string: "VARCHAR",
  date: "DATETIME",
  boolean: "TINYINT(1)",
};

async function create(file) {
  const dataTableName = await genTableName();

  const data = Data.build({
    name: dataTableName,
    contentType: file.mimetype,
    fileSize: file.size,
    originFileName: file.originalname,
  });

  await data.save();
  console.log(data);

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

function getColDef(metaItem) {
  const colDDL = [`${metaItem.name}`];
  let colType = DATA_TYPE_MAP[metaItem.dataType];

  if (metaItem.dataType == "number" && metaItem.floatLength) {
    colType = `${colType}(${metaItem.maxLength}, ${metaItem.floatLength})`;
  } else if (metaItem.dataType == "number" || metaItem.dataType == "string") {
    colType = `${colType}(${metaItem.maxLength})`;
  }

  if (metaItem.isNotNull) {
    colType = `${colType} NOT NULL `;
  }

  if (metaItem.koName) {
    colType = `${colType} COMMENT '${metaItem.koName}'`;
  }

  colDDL.push(colType);

  return colDDL.join(" ");
}

async function makeDataTable(meta) {
  console.log(meta);
  const tableName = await genTableName();
  const ddl = [
    `CREATE TABLE \`${tableName}\` (`,
    `id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `,
  ];
  const constraints = [];

  const colDefs = [];
  const indexDefs = [];

  for (const metaItem of meta) {
    console.log(metaItem);
    let colDef = getColDef(metaItem);
    colDefs.push(colDef);

    if (metaItem.isIndex) {
      indexDefs.push(`INDEX (${metaItem.name})`);
    }
    if (metaItem.isUnique) {
      indexDefs.push(`UNIQUE KEY (${metaItem.name})`);
    }
  }

  ddl.push(colDefs.join(", "));
  if (indexDefs.length) {
    ddl.push(`, ${indexDefs.join(", ")}`);
  }

  ddl.push(")");
  console.log(ddl.join(" "));
  return ddl;
}

module.exports = {
  create,
  genTableName,
  makeDataTable,
};
