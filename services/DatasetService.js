const { Dataset, Meta } = require("../models");

const MetaManager = require("../lib/MetaManager");

class DatasetService {
  async findOriginByProject(projectId) {
    return await Dataset.findOne({
      where: {
        projectId,
        processType: Dataset.processTypes.origin,
      },
    });
  }

  async cloneMeta(originId, targetId) {
    const origin = await Dataset.findOne({
      where: { id: originId },
      include: [
        {
          model: Meta,
          as: "metas",
        },
      ],
    });

    const target = await Dataset.findOne({
      where: { id: targetId },
    });

    // TODO: 테스트 진행을 위해 임시 추가(향후 아래 코드 제거)
    await Meta.destroy({
      where: {
        dataset_id: targetId,
      },
    });

    await MetaManager.createAll(target, origin.metas);
    console.log(target);

    return target;
  }
}

module.exports = DatasetService;
