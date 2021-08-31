var FileManager = require("../lib/FileManager");
var MetaManager = require("../lib/MetaManager");
var DataManager = require("../lib/DataManager");
var RawDataManager = require("../lib/RawDataManager");

const { Data, Meta, MkFeature } = require("../models");
const config = require("../configs/config");
const MkfeatManager = require("../lib/MkfeatManager");

console.log(process.argv);
const option = JSON.parse(process.argv[2]);
console.log(option);

run();

async function run() {
  try {
    const data = await Data.findOne({
      where: { id: option.dataId },
      include: [
        {
          model: Meta,
          as: "metas",
        },
      ],
    });

    if (!option.encoding) {
      option.encoding = await MetaManager.detectEncoding(data.remotePath);
    }

    if (!option.delimiter) {
      option.delimiter = ",";
    }

    const rows = await MetaManager.parseRecord(data, option);
    const result = await RawDataManager.insertData(data, rows);
    data.status = DataManager.DATA_STATUS.done.stat;
    await data.save();

    await RawDataManager.enqueueProfile(data);

    // mkfeat
    console.log("MK feat start!")
    const mkfeatUrl = config.mkfeat.url
    const mkfeatManager = new MkfeatManager({endpoint: mkfeatUrl})
    const extractData = {
      data: {
        uri: `s3://qufa-test/${data.remotePath}`,
        columns: data.metas.map(el => {
          return {
            name: el.name,
            type: el.colType
          }
        })
      },
      operator: []
    }

    const mkExtractCallBack = async(progress) => {
      console.log(`Mkfeat progress: ${progress}`)
      data.mkfeatProgress = progress;
      await data.save()
    }
    
    const mkFeatures = await mkfeatManager.batchExtractJob(extractData, mkExtractCallBack)

    const featuresForBulkInsert = mkFeatures.map(el => {
      return {
        dataId: data.id,
        name: el.name,
        colType: el.type
      }
    })

    await MkFeature.bulkCreate(featuresForBulkInsert)

    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
