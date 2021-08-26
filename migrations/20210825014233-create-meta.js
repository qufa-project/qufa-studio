"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Meta", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      ko_name: {
        type: Sequelize.STRING,
      },
      col_type: {
        type: Sequelize.STRING(30),
      },
      max_length: {
        type: Sequelize.INTEGER,
      },
      float_length: {
        type: Sequelize.INTEGER,
      },
      date_format: {
        type: Sequelize.STRING(50),
      },
      true_value: {
        type: Sequelize.STRING(50),
      },
      is_not_null: {
        type: Sequelize.BOOLEAN,
      },
      is_unique: {
        type: Sequelize.BOOLEAN,
      },
      is_index: {
        type: Sequelize.BOOLEAN,
      },
      col_seq: {
        type: Sequelize.INTEGER,
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

    // And here's where the trick takes place:
    await queryInterface.addColumn(
      "Meta", // name of Source model
      "data_id", // name of the key we're adding
      {
        type: Sequelize.INTEGER,
        references: {
          model: "Data", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Meta");
  },
};
