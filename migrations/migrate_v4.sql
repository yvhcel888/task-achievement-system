-- 任务成就系统 v4 迁移（幂等）：生活/工具扩展通用存储表
-- 执行：mysql -uroot -p < migrate_v4.sql

USE rxy;

CREATE TABLE IF NOT EXISTS extras (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  kind VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_kind (user_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
