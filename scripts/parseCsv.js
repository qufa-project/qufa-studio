var FileManager = require("../lib/FileManager");
var MetaManager = require("../lib/MetaManager");
var DataManager = require("../lib/DataManager");
var RawDataManager = require("../lib/RawDataManager");

const { Data, Meta } = require("../models");

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

    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
