-- 任务成就系统 v2.5 迁移（幂等版）：音乐播放器 + AI 配置 + root 审核
-- 执行：mysql -uroot -p < migrate_v2.sql

USE rxy;

-- 1. 账号表加角色列（幂等）
SET @has_role := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='rxy' AND TABLE_NAME='rxy_web' AND COLUMN_NAME='role');
SET @ddl := IF(@has_role = 0, 'ALTER TABLE rxy_web ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT ''user'' COMMENT ''user/admin''', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 音乐表（file_md5 唯一 → 上传/审核去重）
CREATE TABLE IF NOT EXISTS music (
  song_id    VARCHAR(40)  NOT NULL COMMENT '文件存储名(无扩展)',
  user_id    VARCHAR(100) NOT NULL COMMENT '上传者',
  title      VARCHAR(200) NOT NULL COMMENT '歌曲名',
  artist     VARCHAR(200) NOT NULL DEFAULT 'Unknown' COMMENT '歌手',
  ext        VARCHAR(10)  NOT NULL DEFAULT 'mp3',
  filename   VARCHAR(300) NOT NULL COMMENT '原始文件名',
  file_md5   CHAR(32)     NOT NULL COMMENT '文件MD5(去重)',
  size       BIGINT       NOT NULL DEFAULT 0,
  status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (song_id),
  UNIQUE KEY uk_md5 (file_md5),
  KEY idx_status (status),
  KEY idx_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- 3. 歌单
CREATE TABLE IF NOT EXISTS playlists (
  playlist_id VARCHAR(40)  NOT NULL,
  user_id     VARCHAR(100) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id),
  KEY idx_pl_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id VARCHAR(40) NOT NULL,
  song_id     VARCHAR(40) NOT NULL,
  added_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- 4. AI 配置（api_key 等以 AES-256-GCM 密文存储，密钥来自环境变量 APP_KEY）
CREATE TABLE IF NOT EXISTS ai_configs (
  user_id       VARCHAR(100) NOT NULL,
  base_url_enc  TEXT COMMENT 'AES密文:base_url',
  api_key_enc   TEXT COMMENT 'AES密文:api_key',
  model_enc     TEXT COMMENT 'AES密文:model',
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
