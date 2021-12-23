const { Project, Task, Dataset, Meta, ColStat } = require("../models");
const RawDataManager = require("../lib/RawDataManager");

class ColstatService {
  async calcColStat(projectId) {
    console.log(`projectId: ${projectId}`);
    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: Dataset,
          as: "datasets",
          required: true,
          include: [
            {
              model: Meta,
              as: "metas",
            },
          ],
        },
      ],
    });

    const colstats = [];
    let fairnessDatasetId = -1;

    for (const dataset of project.datasets) {
      if (dataset.processType === Dataset.processTypes.fairness) {
        fairnessDatasetId = dataset.id;
      }
    }

    for (const dataset of project.datasets) {
      for (const meta of dataset.metas) {
        const colCountInfo = await RawDataManager.findColCount(
          dataset.dataTable,
          meta.name
        );

        if (colCountInfo && colCountInfo[0] && colCountInfo[0].length) {
          let i = 0;
          for (const colCountItem of colCountInfo[0]) {
            var colStat = {
              datasetId: fairnessDatasetId,
              colName: meta.name,
              colValue: colCountItem[0],
              colCount: colCountItem[1],
              isOrigin: fairnessDatasetId == dataset.id,
            };

            colstats.push(colStat);
          }
        }
      }
    }

    const results = await ColStat.bulkCreate(colstats, { returning: true });
    return results;
  }
}

module.exports = ColstatService;
