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

    console.log("Mk importance start!");

    const dataTypesForImportance = ["number", "boolean"];

    const targetAvailableMetas = dataset.metas.filter((el) =>
      dataTypesForImportance.includes(el.colType)
    );
    const targetUnAvailableMetas = dataset.metas.filter(
      (el) => !dataTypesForImportance.includes(el.colType)
    );

    const inputs = dataset.metas.map((el) => {
      const obj = {
        id: el.id,
        name: el.name,
        type: el.colType,
      };
      return obj;
    });

    const rowsForBulkInsert = [];

    for (let i = 0; i < targetAvailableMetas.length; i++) {
      const targetMeta = targetAvailableMetas[i];
      for (let j = 0; j < inputs.length; j++) {
        if (inputs[j].name == targetMeta.name) {
          inputs[j]["label"] = true;
        } else {
          delete inputs[j]["label"];
        }
      }

      const mkfeatUrl = config.mkfeat.url;
      const mkfeatManager = new MkfeatManager({ endpoint: mkfeatUrl });

      const uri = `s3://qufa-test/${dataset.remotePath}`;

      const payload = {
        data: {
          uri: uri,
          columns: inputs,
        },
      };

      const results = await mkfeatManager.batchImportanceJob(
        payload,
        async (progress) => {
          const totalProgress =
            i * (100 / targetAvailableMetas.length) +
            progress / targetAvailableMetas.length;
          console.log(`mk importance progress: ${totalProgress}`);
          dataset.importanceProgress = totalProgress;
          await dataset.save();
        }
      );

      for (let i = 0; i < inputs.length; i++) {
        inputs[i]["importance"] = results[i];
      }

      //generate result
      for (let input of inputs) {
        rowsForBulkInsert.push({
          targetId: targetMeta.id,
          featureId: input.id,
          importance: input.importance,
        });
      }
    }

    for (let unableMeta of targetUnAvailableMetas) {
      for (let input of inputs) {
        rowsForBulkInsert.push({
          targetId: unableMeta.id,
          featureId: input.id,
          importance: 0,
        });
      }
    }

    await Importance.bulkCreate(rowsForBulkInsert);

    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
