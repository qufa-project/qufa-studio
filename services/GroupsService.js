const { Group } = require("../models");

const DATA_DEFAULT_PER_PAGE = 10;

class GroupService {
  create = (p) => {
    return new Promise(async (resolve, reject) => {
      try {
        const group = await Group.create(p);
        resolve(group);
      } catch (err) {
        reject(err);
      }
    });
  };

  findAll = (options) => {
    return new Promise(async (resolve, reject) => {
      options.perPage = options.perPage || DATA_DEFAULT_PER_PAGE;

      const offset = (options.currentPage - 1) * options.perPage;

      try {
        const projects = await Group.findAndCountAll({
          offset: offset,
          limit: options.perPage,
          order: [["id", "DESC"]],
        });

        resolve(projects.rows);
      } catch (err) {
        reject(err);
      }
    });
  };
}

module.exports = GroupService;
