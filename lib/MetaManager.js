var FileManager = require("./FileManager");
var jschardet = require("jschardet");

const encodigWhiteList = ["EUC-KR", "cp949", "ascii", "UTF-8", "UTF-16LE"];
const convertNewline = require("convert-newline");
const iconv = require("iconv-lite");
const csv = require("csv-parser");

const { Meta } = require("../models");

const AcceptableType = {
  INTEGER: "int",
  BIGINT: "bigint",
  DECIMAL: "decimal",
  VARCHAR: "varchar",
  TEXT: "text"
}



/**
 *
 * @param {*} records 파일 read stream
 * @param {*} skip csv header line 수 defaul 1
 * @returns {Object} result
 * @returns {string[]} result.types AcceptableType 배열
 * @returns {number[]} result.lengths types가 varchar 또는 text인 경우 동일한 index의 length를 사용
 * @returns {number[]} result.maxValues types가 int 또는 bigint인 경우 동일한 index의 최대값 사용
 * @returns {Object[]} result.doubleLength types가 Decimal인 경우 동일한 index의 length값 사용 (m+d, d)
 * @returns {number[]} result.doubleLength.m 정수부 길이
 * @returns {number[]} result.doubleLength.d 길수부 길이
 */
function extractMeta(records, skip) {
  if(skip) {
    skip = 1;
  }

  const result = checkTypes(records, skip);
  return result;
}

function countDecimalMD(string) {
  const tokens = string.split(".");
  if(tokens.length > 2 || tokens.length === 0) {
    throw new Error("It's not a demical type");
  }

  return {
    m: tokens[0].length,
    d: tokens.length === 2 ? tokens[1].length : 0
  }
}

/**
 * string 값을 받아 Integer, Double, Date, Varchar 타입을 유추하는 함수
 * 
 * @param string Csv 셀 내부의 value
 * @returns AcceptableType
 */
function detectAvailableType(string) {
  try {
    //null인 경우 이전 값을 그대로 가져오도록 
    if(isNull(string)) {
      return null;
    }
    const tempNumn = Number(string);
    if (!isNaN(tempNumn) && string.trim().length !== 0) {
      /**
       * 숫자 타입인 경우 INTEGER와 DOUBLE 중 선택
       */
      return isInt(tempNumn) ? AcceptableType.INTEGER : AcceptableType.DECIMAL
    }

    // if (moment(string, null, true).isValid()) {
    //   return AcceptableType.DATE;
    // }

    return AcceptableType.VARCHAR;
  } catch (err) {
    return AcceptableType.VARCHAR;
  }
}

/**
 * 파라메터로 넘어온 Number 값이 정수인지 판별
 * 
 * @param n 
 * @returns boolean
 */
function isInt(n) {
  return n % 1 === 0;
}

function isNull(value) {
  if (value === null) return true 
  if (typeof value === 'undefined') return true 
  if (typeof value === 'string' && value === '') return true 
  if (Array.isArray(value) && value.length < 1) return true 
  if (typeof value === 'object' && value.constructor.name === 'String' && Object.keys(value).length < 1) return true // new String() return false
  return false;
}

function checkTypes(records, skip) {
  const types = [];
  let lengths = [];
  const maxValues = [];
  const doubleLength = [];
  for (let i = skip; i < records.length; i++) {
    if (i === skip) {
      for (let record of records[i]) {
        const type = detectAvailableType(record)
        types.push(type)
        lengths.push(record.length)
        maxValues.push(type === AcceptableType.INTEGER ? Number(record) : 0);
        doubleLength.push(type === AcceptableType.DECIMAL ? countDecimalMD(record) : null);
      }
      continue;
    }

    for (let j = 0; j < records[i].length; j++) {
        //typecheck 도중 type이 변경 될 수 있기 때문에 type에 관계없이 maxlength는 항상 update 필요
      const currentRecord = records[i][j].trim();
      const currentLength = currentRecord.length;
      if(lengths[j] < currentLength) {
        lengths[j] = currentLength
      }
      
      if(types[j] === AcceptableType.INTEGER) {
        maxValues[j] = maxValues[j] < Number(currentRecord) ? Number(currentRecord) : maxValues[j]
      }

      //type이 varchar인 경우 Type을 확인하지 않고 다음 loop로 진행
      if (types[j] === AcceptableType.VARCHAR) continue;

      //기존 Type과 새로 판별한 Type이 다른 경우 Varchar로 변경
      //단 INTEGER의 경우 DOUBLE로 처리하는 것은 가능해야함
      const availableType = detectAvailableType(currentRecord);
      
      //null인 경우 이전 값을 그대로 가져가도록
      if(availableType === null) {
        continue;
      }

      if (availableType !== types[j] || (availableType === AcceptableType.DECIMAL && availableType === types[j])) {
        if ((availableType === AcceptableType.DECIMAL && types[j] === AcceptableType.INTEGER) 
        || (availableType === AcceptableType.INTEGER && types[j] === AcceptableType.DECIMAL)
        || (availableType === AcceptableType.DECIMAL && availableType === types[j])
        || (types[j] === null && availableType === AcceptableType.DECIMAL)) {
          types[j] = AcceptableType.DECIMAL
          const decimalMD = countDecimalMD(currentRecord);
          // doubleLength가 없는 경우 Integer에서 넘어오는 것이기 때문에 정수부를 lengths[j]로 초기화
          if(doubleLength[j] === null) {
            doubleLength[j] = {
              m: lengths[j],
              d: 0
            }
          }
          doubleLength[j].m = decimalMD.m > doubleLength[j].m ? decimalMD.m : doubleLength[j].m
          doubleLength[j].d = decimalMD.d > doubleLength[j].d ? decimalMD.d : doubleLength[j].d
        } else if (types[j] === null && availableType === AcceptableType.INTEGER) {
          types[j] = AcceptableType.INTEGER;
        }else {
          types[j] = AcceptableType.VARCHAR;
        }
      }        
    }      
  }
  
  // 전체 length를 확인하며 length가 너무 큰 경우 TEXT 타입으로 변경
  // 전체 maxValue를 확이하며 size에 따라 BIGINT로 변경
  lengths = lengths.map(el => el);
  for(let i = 0; i < lengths.length; i++ ) {
    if(lengths[i] > 255) {
      types[i] = AcceptableType.TEXT
    }

    if(maxValues[i] >= 2147483647 && types[i] === AcceptableType.INTEGER) {
      types[i] = AcceptableType.BIGINT
    }

    if(types[i] === null) {
      types[i] = AcceptableType.VARCHAR
    } 
  }

  
  return { types, lengths, maxValues, doubleLength };
}

async function detectEncoding(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const fileStream = FileManager.createReadStream(filePath);
    fileStream
      .on("error", (err) => {
        console.error(err);
        reject(err);
      })
      .on("data", (chunk) => {
        try {
          if (chunks.length < 10) {
            chunks.push(chunk);
          }
        } catch (err) {
          console.error(err);
          reject(err);
        }
      })
      .on("end", () => {
        fileStream.destroy();
      })
      .on("close", () => {
        try {
          const concatedBuffer = Buffer.concat(chunks);
          let encoding = jschardet.detect(concatedBuffer).encoding;
          if (!encodigWhiteList.includes(encoding)) {
            encoding = "EUC-KR";
          }
          resolve(encoding);
        } catch (err) {
          reject(err);
        }
      });
  });
}

async function parseRecord(data, option) {
  return new Promise((resolve, reject) => {
    const results = [];
    const fileStream = FileManager.createReadStream(data.remotePath);
    const converter = convertNewline("lf").stream();
    fileStream
      .pipe(iconv.decodeStream(option.encoding))
      .pipe(converter)
      .pipe(
        csv({
          headers: option.header,
          separator: option.separator || ",",
        })
      )
      .on("error", (err) => {
        reject(err);
      })
      .on("data", (data) => {
        try {
          results.push(Object.values(data));
        } catch (err) {
          reject(err);
        }
      })
      .on("end", () => {
        try {
          resolve(results);
        } catch (err) {
          reject(err);
        }
      });
  });
}


async function createAll(dataset, meta) {
  var metaList = [];
  for (const metaItem of meta) {
    var m = {
      datasetId: dataset.id,
      name: metaItem.name.trim(),
      koName: metaItem.koName || null,
      colType: metaItem.dataType || metaItem.colType,
      maxLength: metaItem.maxLength || null,
      floatLength: metaItem.floatLength || null,
      dateFormat: metaItem.dateFormat || null,
      trueValue: metaItem.trueValue || null,
      isNotNull: metaItem.isNotNull,
      isUnique: metaItem.isUnique,
      isIndex: metaItem.isIndex,
      colSeq: metaList.length,
    };

    metaList.push(m);
  }

  const results = await Meta.bulkCreate(metaList, { returning: true });

  return results;
}

module.exports = {
  extractMeta,
  detectEncoding,
  parseRecord,
  createAll,
};
