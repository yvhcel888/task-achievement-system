-- 任务成就系统 v5 迁移（幂等）：歌单分享码 + 密码重置审核
USE rxy;

-- 歌单分享码（8 位唯一，playlist_id 本身太长不适合当分享码）
ALTER TABLE playlists ADD COLUMN share_code VARCHAR(8) NULL AFTER name;
CREATE INDEX idx_share_code ON playlists (share_code);

-- 密码重置申请表
CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  new_hash VARCHAR(300) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
