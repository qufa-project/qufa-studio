var AWS = require('aws-sdk');
var config = require('../configs/config')

var s3 = new AWS.S3(config.aws)

function uploadFile(file) {
  return new Promise(async (resolve, reject) => {
    try {
      const objReq = {
        Bucket: 'qufa-test',
        Key: `${new Date().getTime()}_${file.originalname}`,
        Body: file.buffer

      }

      s3.upload(objReq, function (err, data) {
        if (err) { reject(err); }
        else { resolve(data.Key); }
      })
    } catch (err) {
      reject(err);
    }
  })
}

module.exports = {
  uploadFile
}