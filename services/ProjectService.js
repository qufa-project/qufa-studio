const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");

const { Project, Dataset, Meta, Task } = require("../models");

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

  async find(id) {
    const project = await Project.findByPk(id);
    return project;
  }

  async findWithRelations(id) {
    const project = await Project.findOne({
      where: { id: id },
      include: [
        {
          model: Dataset,
          as: "datasets",
          include: [
            {
              model: Meta,
              as: "metas",
            },
          ],
        },
        {
          model: Task,
          as: "tasks",
        },
      ],
    });

    return project;
  }

  async findWithOriginDataset(id) {
    const project = await Project.findOne({
      where: { id: id },
      include: [
        {
          model: Dataset,
          as: "datasets",
          where: { processType: Dataset.processTypes.origin },
          include: [
            {
              model: Meta,
              as: "metas",
            },
          ],
        },
      ],
    });

    return project;
  }

  async findWithDatasets(id) {
    const project = await Project.findOne({
      where: { id: id },
      include: [
        {
          model: Dataset,
          as: "datasets",
          include: [
            {
              model: Meta,
              as: "metas",
            },
          ],
        },
      ],
    });

    return project;
  }

  async findWithTasks(id) {
    const project = await Project.findOne({
      where: { id: id },
      include: [
        {
          model: Task,
          as: "tasks",
        },
      ],
    });

    return project;
  }

  async createTasks(project, taskList) {
    if (project.tasks.length) {
      await Task.destroy({
        where: {
          project_id: project.id,
        },
      });
    }

    let taskSeq = 1;
    const tasks = [];

    for (const taskName of taskList) {
      tasks.push({
        projectId: project.id,
        task: taskName,
        status: Task.status.init.stat,
        seq: taskSeq,
      });

      taskSeq = taskSeq + 1;
    }

    const results = await Task.bulkCreate(tasks, { returning: true });

    return results;
  }

  findAll = (options) => {
    return new Promise(async (resolve, reject) => {
      options.perPage = options.perPage || DATA_DEFAULT_PER_PAGE;

      const offset = (options.currentPage - 1) * options.perPage;

      try {
        const projects = await Project.findAndCountAll({
          include: [
            {
              model: Task,
              as: "tasks",
              attributes: ["id"],
            },
            {
              model: Dataset,
              as: "datasets",
              required: false,
              where: { processType: "origin" },
            },
          ],
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

  findAllByGroup = (options) => {
    return new Promise(async (resolve, reject) => {
      options.perPage = options.perPage || DATA_DEFAULT_PER_PAGE;

      const offset = (options.currentPage - 1) * options.perPage;

      try {
        const count = await Project.count({
          where: {
            group_id:{
              [Op.eq]: options.groupId
            }
          }
        })
        const projects = await Project.findAll({
          include: [
            {
              model: Task,
              as: "tasks",
              attributes: ["id"],
            },
            {
              model: Dataset,
              as: "datasets",
              required: false,
              where: { processType: "origin" },
            },
          ],
          offset: offset,
          limit: options.perPage,
          order: [["id", "DESC"]],
          where: {
            group_id:{
              [Op.eq]: options.groupId
            }
          }
        });
        resolve({
          count: count,
          rows: projects
        });
      } catch (err) {
        reject(err);
      }
    });
  };
}

module.exports = ProjectService;
