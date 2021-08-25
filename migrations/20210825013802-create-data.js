"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Data", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      content_type: {
        type: Sequelize.STRING,
      },
      file_size: {
        type: Sequelize.BIGINT,
      },
      remote_path: {
        type: Sequelize.STRING,
      },
      origin_file_name: {
        type: Sequelize.STRING,
      },
      data_table: {
        type: Sequelize.STRING,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Data");
  },
};
