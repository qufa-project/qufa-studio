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

// TODO: 어떻게 저장을 할지 정한 후 저장하기 위한 Model 및 로직 구현
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
    
    const inputs = data.metas.map(el => {
      const obj = {
        name: el.name,
        type: el.colType
      }

      if(el.id === option.metaId) {
        obj["label"] = true
      }
      return obj
    })

    const mkfeatUrl = config.mkfeat.url
    const mkfeatManager = new MkfeatManager({endpoint: mkfeatUrl})

    const uri = `s3://qufa-test/${data.remotePath}`

    const payload = {
      data: {
        uri: uri,
        columns: inputs
      }
    }

    const result = await mkfeatManager.batchImportanceJob(payload, async (progress) => {
      console.log(progress)
    })

    console.log(result)
    
    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
