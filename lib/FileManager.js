var AWS = require("aws-sdk");
var config = require("../configs/config");

var s3 = new AWS.S3(config.aws);

/**
 * @param {Object} file multipartform multer 에서 제공하는 file object
 * @param {string} file.fieldname 업로드시 fieldname,
 * @param {string} file.originalname 업로드한 원본 파일 명,
 * @param {string} file.encoding 파일 인코딩 ex) '7bit',
 * @param {string} file.mimetype 파일 타입 ex) 'text/csv',
 * @returns {AWS.S3.ManagedUpload.SendData} data AWS s3 응답
 */
function uploadFile(dataId, fileName, file) {
  return new Promise(async (resolve, reject) => {
    try {
      const objReq = {
        Bucket: "qufa-test",
        Key: `${dataId}/${fileName}`,
        Body: file.buffer,
      };

      s3.upload(objReq, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data.Key);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 *
 * @param {string} fileKey S3에 저장된 파일Key(파일명)
 * @retuens {Readable} ReadStream
 */
function createReadStream(fileKey) {
  const objReq = {
    Bucket: "qufa-test",
    Key: fileKey,
  };
  const stream = s3.getObject(objReq).createReadStream();
  return stream;
}

async function findS3Objct(fileKey) {
  const objReq = {
    Bucket: "qufa-test",
    Key: fileKey,
  };

  return await s3.getObject(objReq).promise();
}

async function findS3Meta(fileKey) {
  const params = {
    Bucket: "qufa-test",
    Key: fileKey,
  };

  return await s3.headObject(params).promise();
}

module.exports = {
  uploadFile,
  createReadStream,
  findS3Objct,
  findS3Meta,
};
