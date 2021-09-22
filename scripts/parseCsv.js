var MetaManager = require("../lib/MetaManager");
var DatasetManager = require("../lib/DatasetManager");
var RawDataManager = require("../lib/RawDataManager");
var ImputationManager = require("../lib/ImputationManager");

const { Dataset, Meta, MkFeature, Importance } = require("../models");
const config = require("../configs/config");
const MkfeatManager = require("../lib/MkfeatManager");

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
      await RawDataManager.insertData(dataset, rows);
      dataset.status = Dataset.status.done.stat;
      await dataset.save();
    } catch (error) {
      console.log("Exception in insertData =======================");
      dataset.status = Dataset.status.error.stat;
      await dataset.save();

      process.exit(0);
    }

    await RawDataManager.enqueueProfile(dataset);

    //Imputation
    // console.log("Call imputation / outlier");
    // await ImputationManager.runImputation(dataset.remotePath);
    // await ImputationManager.runOutlier(dataset.remotePath);

    // mkfeat
    // Feature
    console.log("MK feat start!");
    // const mkfeatUrl = config.mkfeat.url;
    // const mkfeatManager = new MkfeatManager({ endpoint: mkfeatUrl });
    // const extractData = {
    //   data: {
    //     uri: `s3://qufa-test/${dataset.remotePath}`,
    //     columns: dataset.metas.map((el) => {
    //       return {
    //         name: el.name,
    //         type: el.colType,
    //       };
    //     }),
    //   },
    //   operator: [],
    // };

    // const mkExtractCallBack = async (progress) => {
    //   console.log(`Mkfeat progress: ${progress}`);
    //   dataset.mkfeatProgress = progress;
    //   await dataset.save();
    // };

    // const mkFeatures = await mkfeatManager.batchExtractJob(
    //   extractData,
    //   mkExtractCallBack
    // );

    // const featuresForBulkInsert = mkFeatures.map((el) => {
    //   return {
    //     datasetId: dataset.id,
    //     name: el.name,
    //     colType: el.type,
    //   };
    // });

    // await MkFeature.bulkCreate(featuresForBulkInsert);

    // importance nxn matrix를 생성한다.
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
