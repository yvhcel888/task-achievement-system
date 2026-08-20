// SQLite 存储层(无 MySQL 版)
// 用法: DB_ENGINE=sqlite node server/api.mjs
// 实现 mysql2 pool 兼容接口(query),业务代码零改动
// 数据文件: ./data/app.sqlite(可用 DB_FILE 环境变量覆盖)
// 引擎: better-sqlite3(成熟稳定,预编译二进制,无实验特性风险)
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'app.sqlite')

// ============ 建表(SQLite 方言,全量 schema) ============
const SCHEMA = `
CREATE TABLE IF NOT EXISTS rxy_web (
  user_id  TEXT PRIMARY KEY,
  password TEXT,
  role     TEXT NOT NULL DEFAULT 'user'
);
CREATE TABLE IF NOT EXISTS rxy_web_data (
  user_id    TEXT PRIMARY KEY,
  data       TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS music (
  song_id    TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL,
  artist     TEXT NOT NULL DEFAULT 'Unknown',
  ext        TEXT NOT NULL DEFAULT 'mp3',
  filename   TEXT NOT NULL,
  file_md5   TEXT NOT NULL UNIQUE,
  size       INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS playlists (
  playlist_id TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  share_code  TEXT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id TEXT NOT NULL,
  song_id     TEXT NOT NULL,
  added_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id)
);
CREATE TABLE IF NOT EXISTS ai_configs (
  user_id      TEXT PRIMARY KEY,
  base_url_enc TEXT,
  api_key_enc  TEXT,
  model_enc    TEXT,
  updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wall_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS announcements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS goals (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL,
  reward     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS personas (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  name           TEXT NOT NULL,
  emoji          TEXT NOT NULL DEFAULT 'bot',
  system_prompt  TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS extras (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  kind       TEXT NOT NULL,
  value      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS password_resets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  new_hash   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_music_status ON music(status);
CREATE INDEX IF NOT EXISTS idx_music_user ON music(user_id);
CREATE INDEX IF NOT EXISTS idx_pl_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_pl_share ON playlists(share_code);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_wall_user ON wall_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_extras_user_kind ON extras(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_resets_status ON password_resets(status);
`

// ============ MySQL 方言 → SQLite 转换 ============
function convertSQL(sql) {
  let s = sql
  // NOW() → CURRENT_TIMESTAMP
  s = s.replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP")
  // ON DUPLICATE KEY UPDATE a=VALUES(a), b=VALUES(b) → ON CONFLICT DO UPDATE SET a=excluded.a, b=excluded.b
  s = s.replace(
    /ON DUPLICATE KEY UPDATE\s+([\s\S]*?)(?:;|$)/i,
    (_, assigns) => {
      const pairs = assigns
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          const m = p.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*VALUES\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)$/i)
          if (m) return `${m[1]} = excluded.${m[2]}`
          return p
        })
        .join(', ')
      return `ON CONFLICT DO UPDATE SET ${pairs} `
    },
  )
  return s
}

// ============ 初始化 ============
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
const db = new Database(DB_FILE)
db.pragma('busy_timeout = 5000')
db.exec(SCHEMA)

// ============ 兼容 mysql2 pool.query ============
export const pool = {
  async query(sql, params = []) {
    const stmt = convertSQL(sql)
    const isSelect = /^\s*SELECT/i.test(stmt)
    const isInsert = /^\s*INSERT/i.test(stmt)
    try {
      if (isSelect) {
        const rows = db.prepare(stmt).all(...params)
        return [rows, []]
      }
      const result = db.prepare(stmt).run(...params)
      const header = {
        affectedRows: Number(result.changes || 0),
        insertId: Number(result.lastInsertRowid || 0),
      }
      return [header, []]
    } catch (e) {
      // 兼容 mysql2 的报错形态:抛 Error(带 code 尽量相近)
      const err = new Error(`SQLite error: ${e.message}\nSQL: ${stmt}`)
      err.code = 'SQLITE_ERROR'
      throw err
    }
  },
  async execute(sql, params = []) {
    return this.query(sql, params)
  },
}

export function closeStore() {
  try {
    db.close()
  } catch {
    /* ignore */
  }
}
