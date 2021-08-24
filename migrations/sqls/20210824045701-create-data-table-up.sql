/* Replace with your SQL commands */
CREATE TABLE `data` (
  `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `content_type` VARCHAR(255) NOT NULL,
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `remote_path` VARCHAR(255),
  `origin_file_name` VARCHAR(255) NOT NULL,
  `data_table` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE UNIQUE INDEX data_name_idx
ON `data`(`name`);

CREATE UNIQUE INDEX data_data_table_idx
ON `data`(`data_table`);