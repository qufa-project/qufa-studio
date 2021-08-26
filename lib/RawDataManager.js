const pool = require("../db/pool");
const moment = require("moment");

const DATA_TYPE_MAP = {
  number: "DECIMAL",
  string: "VARCHAR",
  date: "DATETIME",
  boolean: "TINYINT(1)",
};

function getColDef(metaItem) {
  const colDDL = [`${metaItem.name}`];
  let colType = DATA_TYPE_MAP[metaItem.colType];

  if (metaItem.colType == "number" && metaItem.floatLength) {
    colType = `${colType}(${metaItem.maxLength}, ${metaItem.floatLength})`;
  } else if (metaItem.colType == "number" || metaItem.colType == "string") {
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

async function makeDataTable(tableName, metaList) {
  const ddl = [
    `CREATE TABLE \`${tableName}\` (`,
    `id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `,
  ];
  const constraints = [];

  const colDefs = [];
  const indexDefs = [];

  for (const metaItem of metaList) {
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

  return await pool.execute(ddl.join(" "));
}

async function insertData(data, rows) {
  const sql = [`INSERT INTO \`${data.dataTable}\``];

  const cols = [];
  for (const meta of data.metas) {
    cols.push(meta.name);
  }
  sql.push(`(${cols.join(",")})`);
  sql.push(" VALUES ");

  var valueSql = [];
  for (const row of rows) {
    const r = [];
    let colIdx = 0;
    for (const value of row) {
      let val = value;
      const meta = data.metas[colIdx];
      if (val) {
        if (meta.colType == "date") {
          val = moment(val, meta.dateFormat).format("YYYY/MM/DD hh:mm:ss");
          val = `STR_TO_DATE('${val}',"%Y/%m/%d %k:%i:%s")`;
        } else if (meta.colType == "boolean") {
          console.log(meta.trueValue);
          console.log(val.trim() == meta.trueValue);
          val = val.trim() == meta.trueValue ? 1 : 0;
        } else if (meta.colType == "string") {
          val = `'${val}'`;
        }
      } else {
        val = "NULL";
      }

      r.push(val);
      colIdx = colIdx + 1;
    }

    valueSql.push(`(${r.join(",")})`);
  }
  sql.push(valueSql.join(", "));

  return await pool.execute(sql.join(""));
}

module.exports = {
  makeDataTable,
  insertData,
};
