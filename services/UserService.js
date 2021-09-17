const bcrypt = require('bcrypt');
const { User, Group } = require("../models");
const { Op } = require("sequelize");

const DATA_DEFAULT_PER_PAGE = 10;
const saltRounds = 10;

class UserService {
  create = (p) => {
    return new Promise(async (resolve, reject) => {
      try {
        p.password = this.hashPassword(p.password)
        const user = await User.create(p);
        resolve(user);
      } catch (err) {
        reject(err);
      }
    });
  };
  
  findAllByGroup = (options) => {
    return new Promise(async (resolve, reject) => {
      options.perPage = options.perPage || DATA_DEFAULT_PER_PAGE;

      const offset = (options.currentPage - 1) * options.perPage;      
      const findOption = {
        offset: offset,
        limit: options.perPage,
        order: [["id", "DESC"]],
        include: [
          {
            model: Group,
            as: "group",
          },
        ],
        where: {
          group_id:{
            [Op.eq]: options.groupId
          }
        }
      }

      try {
        const users = await User.findAndCountAll(findOption);
        resolve(users);
      } catch (err) {
        reject(err);
      }
    });
  };

  async findById(id) {
    const user = await User.findOne({
      where: { id: id },
    });

    return user;
  }

  async findByUsername(username) {
    const user = await User.findOne({
      where: { username: username },
      include: [
        {
          model: Group,
          as: "group",
        },
      ],
    });

    return user;
  }

  validateUserPassword(user, password) {
    const match = bcrypt.compareSync(password, user.password);
    return match
  }

  hashPassword(password) {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    return hash
  }
}

module.exports = UserService;
