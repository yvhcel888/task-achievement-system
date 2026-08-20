-- 任务成就系统（Task Achievement System）基础建库脚本
-- 适用: MySQL 5.7+ / 8.0+ (utf8mb4,general_ci 兼容两种版本)
-- 执行: mysql -uroot -p < migrate_v1.sql

CREATE DATABASE IF NOT EXISTS rxy DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE rxy;

-- ============ 1. 账号表 ============
CREATE TABLE IF NOT EXISTS rxy_web (
  user_id  varchar(100) NOT NULL,
  password varchar(10000) DEFAULT NULL COMMENT 'scrypt 加盐哈希',
  role     varchar(20) NOT NULL DEFAULT 'user' COMMENT 'user/admin',
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ 2. 用户任务数据表 ============
CREATE TABLE IF NOT EXISTS rxy_web_data (
  user_id    varchar(100) NOT NULL,
  data       longtext COMMENT '任务/成就/进度 JSON',
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 后续迁移: migrate_v2.sql(音乐/AI/root审核)、migrate_v3.sql(社区)、migrate_v4.sql(通用扩展)、migrate_v5.sql(歌单分享码/密码重置)
