"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addIndex("Tasks", ["seq"], {
      name: "tasks_seq_idx",
    });

    await queryInterface.addIndex("Tasks", ["status"], {
      name: "tasks_status_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex("Tasks", "tasks_status_idx");
    await queryInterface.removeIndex("Tasks", "tasks_seq_idx");
  },
};
