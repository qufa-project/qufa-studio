'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Importance', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      importance: {
        type: Sequelize.DECIMAL(11,10)
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // And here's where the trick takes place:
    await queryInterface.addColumn(
      "Importance", // name of Source model
      "target_id", // name of the key we're adding
      {
        type: Sequelize.INTEGER,
        references: {
          model: "Meta", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }
    );

    // And here's where the trick takes place:
    await queryInterface.addColumn(
      "Importance", // name of Source model
      "feature_id", // name of the key we're adding
      {
        type: Sequelize.INTEGER,
        references: {
          model: "Meta", // name of Target model
          key: "id", // key in Target model that we're referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Importance');
  }
};