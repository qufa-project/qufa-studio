var FileManager = require("./FileManager")
var jschardet = require("jschardet")

const encodigWhiteList = ["EUC-KR", "cp949", "ascii", "UTF-8", "UTF-16LE"]
const convertNewline = require("convert-newline");
const iconv = require('iconv-lite');
const csv = require('csv-parser');

/**
 * 
 * @param {*} readStream 파일 read stream
 * @returns 
 */
function extractMeta(readStream) {
  return
}

async function detectEncoding(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const fileStream = FileManager.createReadStream(filePath);
    fileStream
      .on('error', (err) => {
        console.error(err);
        reject(err);
      })
      .on('data', (chunk) => {
        try {
          if(chunks.length < 10) {
            chunks.push(chunk);
          }
        } catch (err) {
          console.error(err);
          reject(err);
        }
      })
      .on('end', () => {
        fileStream.destroy();
      })
      .on('close', () => {
        try {
          const concatedBuffer = Buffer.concat(chunks);
          let encoding = jschardet.detect(concatedBuffer).encoding;
          if(!encodigWhiteList.includes(encoding)) {
            encoding = 'EUC-KR'
          }
          resolve(encoding);
        } catch (err) {
          reject(err);
        }
      })
  })
}

async function parseRecord(filePath, encoding, separator) {
  return new Promise((resolve, reject) => {
    const results = [];
    const fileStream = FileManager.createReadStream(filePath);
    const converter = convertNewline("lf").stream();
    fileStream
      .pipe(iconv.decodeStream(encoding))
      .pipe(converter)
      .pipe(csv({
        headers: false,
        separator: separator ? separator : ','
      }))
      .on('error', (err) => {
        reject(err);
      })
      .on('data', (data) => {
        try {
          results.push(Object.values(data))
        } catch(err) {
          reject(err);
        }
      })
      .on('end', () => {
        try {
          resolve(results);
        } catch(err) {
          reject(err);
        }
      });
  })
}

module.exports = {
  extractMeta,
  detectEncoding,
  parseRecord
}

