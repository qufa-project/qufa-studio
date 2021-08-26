var FileManager = require("./FileManager");
var jschardet = require("jschardet");

const encodigWhiteList = ["EUC-KR", "cp949", "ascii", "UTF-8", "UTF-16LE"];
const convertNewline = require("convert-newline");
const iconv = require("iconv-lite");
const csv = require("csv-parser");

const { Meta } = require("../models");

/**
 *
 * @param {*} readStream 파일 read stream
 * @returns
 */
function extractMeta(readStream) {
  return;
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

async function createAll(data, meta) {
  var metaList = [];
  for (const metaItem of meta) {
    var m = {
      dataId: data.id,
      name: metaItem.name.trim(),
      koName: metaItem.koName || null,
      colType: metaItem.dataType,
      maxLength: metaItem.maxLength,
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
