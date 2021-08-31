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
    if (row.length) {
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
  }
  sql.push(valueSql.join(", "));

  return await pool.execute(sql.join(""));
}

async function search(data, options) {
  const cols = [];
  for (const meta of data.metas) {
    cols.push(meta.name);
  }

  const limit = (options.currentPage - 1) * options.perPage;

  if (!options.where) {
    options.where = [];
  }

  if (!options.order) {
    options.order = [options.sortCol, options.sortDir];
  }

  const countQuery = `
    SELECT COUNT(*) cnt FROM \`${data.dataTable}\` 
    WHERE 1 = 1
    ${options.where.join(" AND ")}
    ORDER BY ${options.order.join(" ") || "id"}
    `;

  const count = await pool.query(countQuery);

  let sql = `
    SELECT ${cols.join(", ")} FROM \`${data.dataTable}\` 
    WHERE 1 = 1
    ${options.where.join(" AND ")}
    ORDER BY ${options.order.join(" ") || "id"}
    LIMIT ${limit}, ${options.perPage}
    `;

  const rows = await pool.query({ sql, rowsAsArray: true });

  return {
    count: count[0][0],
    rows: rows[0],
  };
}

async function enqueueProfile(data) {
  const sql = `
  INSERT INTO job_queue(target_title)
  VALUES('${data.dataTable}');
  `;

  return await pool.execute(sql);
}

module.exports = {
  search,
  makeDataTable,
  insertData,
  enqueueProfile,
};
