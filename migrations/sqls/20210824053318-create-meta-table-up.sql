CREATE TABLE `meta` (
  `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
  `data_id` MEDIUMINT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `ko_name` VARCHAR(255),
  `col_type` VARCHAR(30),
  `max_length` INT,
  `float_length` INT,
  `date_format` VARCHAR(50) NOT NULL,
  `true_value` VARCHAR(50) NOT NULL,
  `is_not_null` TINYINT(1),
  `is_unique` TINYINT(1),
  `is_index` TINYINT(1),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  FOREIGN KEY (`data_id`) REFERENCES `data`(`id`) ON DELETE CASCADE
);

