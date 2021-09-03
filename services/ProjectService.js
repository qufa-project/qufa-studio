const { Project, Dataset } = require("../models");

const DATA_DEFAULT_PER_PAGE = 10;

class ProjectService {
  create = (p) => {
    return new Promise(async (resolve, reject) => {
      try {
        const project = await Project.create(p);
        resolve(project);
      } catch (err) {
        reject(err);
      }
    });
  };

  async findWithDatasets(id) {
    const project = await Project.findOne({
      where: { id: id },
      include: [
        {
          model: Dataset,
          as: "datasets",
        },
      ],
    });

    return project;
  }

  findAll = (options) => {
    return new Promise(async (resolve, reject) => {
      options.perPage = options.perPage || DATA_DEFAULT_PER_PAGE;

      const offset = (options.currentPage - 1) * options.perPage;

      try {
        const projects = await Project.findAndCountAll({
          offset: offset,
          limit: options.perPage,
          order: [["id", "DESC"]],
        });

        resolve(projects);
      } catch (err) {
        reject(err);
      }
    });
  };
}

module.exports = ProjectService;
