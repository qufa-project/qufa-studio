"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addConstraint("Datasets", {
      type: "FOREIGN KEY",
      fields: ["project_id"],
      name: "FK_project_id_datasets",
      references: {
        table: "Projects",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addIndex("Datasets", ["project_id"], {
      name: "datasets_project_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex("Datasets", "datasets_project_id_idx");
    await queryInterface.removeConstraint("Datasets", "FK_project_id_datasets");
  },
};
