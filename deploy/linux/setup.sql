-- 任务成就系统 - MySQL 建库建表脚本（MySQL 8.0+）
-- 执行：mysql -uroot -p < setup.sql

CREATE DATABASE IF NOT EXISTS rxy
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE rxy;

-- 账号表：密码存 scrypt 加盐哈希（格式 scrypt$salt$hash），不存明文
CREATE TABLE IF NOT EXISTS rxy_web (
  user_id  VARCHAR(100)  NOT NULL COMMENT '用户名（唯一）',
  password VARCHAR(10000) NOT NULL COMMENT 'scrypt 加盐哈希',
  PRIMARY KEY (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- 用户数据表：每个账号一份 JSON 数据（tasks + progress）
CREATE TABLE IF NOT EXISTS rxy_web_data (
  user_id    VARCHAR(100) NOT NULL COMMENT '用户名',
  data       LONGTEXT     COMMENT '任务/进度 JSON',
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- 若 root 通过 TCP 登录被 auth_socket 拒绝，可执行（把密码换成你的）：
-- ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '你的密码';
-- FLUSH PRIVILEGES;
