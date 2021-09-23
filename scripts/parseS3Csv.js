const DatasetManager = require("../lib/DatasetManager");
const MetaManager = require("../lib/MetaManager");
const RawDataManager = require("../lib/RawDataManager");

const { Task, Dataset, Meta } = require("../models");
const config = require("../configs/config");

console.log(process.argv);
const option = JSON.parse(process.argv[2]);
console.log(option);

run();

async function run() {
  try {
    const dataset = await Dataset.findOne({
      where: { id: option.datasetId },
      include: [
        {
          model: Meta,
          as: "metas",
        },
        {
          model: Task,
          as: "task",
        },
      ],
    });

    if (!option.encoding) {
      option.encoding = await MetaManager.detectEncoding(dataset.remotePath);
    }

    if (!option.delimiter) {
      option.delimiter = ",";
    }

    const rows = await MetaManager.parseRecord(dataset, option);
    try {
      await RawDataManager.makeDataTable(dataset.dataTable, dataset.metas);
      await RawDataManager.insertData(dataset, rows.slice(1));
      dataset.status = Dataset.status.done.stat;
      await dataset.save();

      const task = dataset.task;
      task.status = Task.status.profiling.stat;

      await task.save();
    } catch (error) {
      console.log("Exception in insertData =======================");
      console.error(error);
      dataset.status = Dataset.status.error.stat;
      await dataset.save();

      const task = dataset.task;
      task.status = Task.status.error.stat;
      await task.save();

      process.exit(0);
    }

    await RawDataManager.enqueueProfile(dataset);

    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
