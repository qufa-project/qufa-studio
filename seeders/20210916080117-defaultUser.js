'use strict';

const UserService = require("../services/UserService");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      password: '$2b$10$Bf6JrSq8z4M/zFc8OPoVMO3sDEu1D4JqU7hwZ/qC9JKKxfwYIz1kK',
      group_id: 1,
      updated_at: new Date(),
      created_at: new Date()
    }])
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Users', null, {});
  }
};
