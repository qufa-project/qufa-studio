var FileManager = require("../lib/FileManager");
var MetaManager = require("../lib/MetaManager");
var DataManager = require("../lib/DataManager");
var RawDataManager = require("../lib/RawDataManager");

const { Data, Meta, MkFeature, Importance } = require("../models");
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

    // importance nxn matrix를 생성한다.
    console.log("Mk importance start!");

    const dataTypesForImportance = ["number", "boolean"]

    const targetAvailableMetas = data.metas.filter(el => dataTypesForImportance.includes(el.colType))

    const inputs = data.metas.map(el => {
      const obj = {
        id: el.id,
        name: el.name,
        type: el.colType
      }
      return obj
    })

    const rowsForBulkInsert = []

    for(let i = 0; i < targetAvailableMetas.length; i++) {
      const targetMeta = targetAvailableMetas[i]
      for(let j = 0; j < inputs.length; j++) {
        if(inputs[j].name == targetMeta.name) {
          inputs[j]["label"] = true
        } else {
          delete inputs[j]["label"]
        }
      }

      const mkfeatUrl = config.mkfeat.url
      const mkfeatManager = new MkfeatManager({endpoint: mkfeatUrl})

      const uri = `s3://qufa-test/${data.remotePath}`

      const payload = {
        data: {
          uri: uri,
          columns: inputs
        }
      }

      const results = await mkfeatManager.batchImportanceJob(payload, async (progress) => {
        const totalProgress = (i * (100/targetAvailableMetas.length)) + (progress/targetAvailableMetas.length)
        console.log(`mk importance progress: ${totalProgress}`)
        data.importanceProgress = totalProgress;
        await data.save()
      })

      for(let i = 0; i < inputs.length; i++ ) {
        inputs[i]["importance"] = results[i]
      }
  
      //generate result
      for(let input of inputs) {
        rowsForBulkInsert.push({
          targetId: targetMeta.id,
          featureId: input.id,
          importance: input.importance
        })
      }
    }

    await Importance.bulkCreate(rowsForBulkInsert)

    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
