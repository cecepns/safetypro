-- SAFETYPRO initial schema (MySQL)
-- Jalankan file ini di database yang dipakai aplikasi (DB_NAME)
-- Contoh:  mysql -u root -p safetypro < 001_init_safetypro_schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Tabel users: akun login (Admin/Koordinator/Inspektor)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'inspektor',
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel departments: master departemen
CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_code (code),
  KEY idx_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel apd_assets: inventaris APD
CREATE TABLE IF NOT EXISTS apd_assets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id INT UNSIGNED NOT NULL,
  nama_apd VARCHAR(255) NOT NULL,
  tag_id VARCHAR(100) NOT NULL,
  kondisi ENUM('layak','perlu_perbaikan','rusak_total') NOT NULL DEFAULT 'layak',
  lokasi VARCHAR(255) DEFAULT NULL,
  last_inspection_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_apd_assets_tag_id (tag_id),
  KEY idx_apd_assets_department_id (department_id),
  KEY idx_apd_assets_nama_apd (nama_apd),
  CONSTRAINT fk_apd_assets_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel inspection_logs: log riwayat inspeksi APD
CREATE TABLE IF NOT EXISTS inspection_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  inspector_name VARCHAR(255) NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  tag_id VARCHAR(100) NOT NULL,
  lokasi VARCHAR(255) NOT NULL,
  kondisi ENUM('layak','perlu_perbaikan','rusak_total') NOT NULL,
  verifikasi_k3l TEXT DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  inspected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inspection_logs_department_id (department_id),
  KEY idx_inspection_logs_tag_id (tag_id),
  KEY idx_inspection_logs_inspected_at (inspected_at),
  CONSTRAINT fk_inspection_logs_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

