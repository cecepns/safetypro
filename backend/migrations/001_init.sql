-- SAFETYPRO - Initial schema

CREATE DATABASE IF NOT EXISTS safetypro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE safetypro;

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apd_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  nama_apd VARCHAR(100) NOT NULL,
  tag_id VARCHAR(100) NOT NULL UNIQUE,
  kondisi ENUM('layak','perlu_perbaikan','rusak_total') DEFAULT 'layak',
  lokasi VARCHAR(150) DEFAULT NULL,
  last_inspection_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_apd_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS inspection_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  inspector_name VARCHAR(100) NOT NULL,
  department_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  tag_id VARCHAR(100) NOT NULL,
  lokasi VARCHAR(150) NOT NULL,
  kondisi ENUM('layak','perlu_perbaikan','rusak_total') NOT NULL,
  verifikasi_k3l TEXT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_logs_asset_tag
    FOREIGN KEY (tag_id) REFERENCES apd_assets(tag_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin','viewer') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, full_name, role)
VALUES ('admin', 'admin123', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE username = username;


