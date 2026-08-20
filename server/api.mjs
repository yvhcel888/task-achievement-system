/**
 * 任务成就系统 - 后端 API 中间件（内嵌于 Vite dev/preview 服务器）
 *
 * 功能：
 *  - POST /api/auth/register   注册（userId + password）
 *  - POST /api/auth/login      登录（返回随机 session token）
 *  - POST /api/auth/logout     注销
 *  - GET  /api/data            读取当前用户的任务/进度数据
 *  - POST /api/data            保存当前用户的任务/进度数据
 *
 * 安全措施：
 *  - 密码：Node 内置 crypto.scrypt 加盐哈希（格式 scrypt$salt$hash），不存明文
 *  - 存储：mysql2 参数化查询，防 SQL 注入
 *  - 登录：同一 IP 5 次失败锁定 60 秒，防爆破
 *  - 会话：256 位随机 token，7 天过期，仅存服务端内存
 *  - 数据：按 user_id 隔离，接口必须携带有效 token
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'
import { handleMusicApi } from './music-api.mjs'
import { handleAiApi } from './ai-api.mjs'
import { handleCommunityApi } from './community-api.mjs'
import { handleBiliApi } from './bili-api.mjs'
import { handleMSearchApi } from './msearch-api.mjs'

// ============ 数据库连接池 ============
// 双引擎:
//   默认   → MySQL(mysql2),默认值适配 Windows 本机(root/123456),Linux 部署通过环境变量覆盖:
//           DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
//   DB_ENGINE=sqlite → 无 MySQL 版(SQLite 文件存储,零依赖,数据在 ./data/app.sqlite)
const DB_ENGINE = (process.env.DB_ENGINE || 'mysql').toLowerCase()
let pool
if (DB_ENGINE === 'sqlite') {
  const { pool: sqlitePool, closeStore } = await import('./sqlite-store.mjs')
  pool = sqlitePool
  process.on('exit', closeStore)
} else {
  const mysql = await import('mysql2/promise')
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'rxy',
    connectionLimit: 5,
    waitForConnections: true,
    charset: 'utf8mb4',
  })
}

// ============ 密码哈希（scrypt + 随机盐） ============
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function verifyPassword(password, stored) {
  try {
    const parts = String(stored).split('$')
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false
    const calc = scryptSync(password, parts[1], 64)
    const expected = Buffer.from(parts[2], 'hex')
    return calc.length === expected.length && timingSafeEqual(calc, expected)
  } catch {
    return false
  }
}

// ============ 会话（内存 token，7 天过期） ============
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000
const sessions = new Map() // token -> { userId, expiresAt }

function createToken(userId) {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS })
  return token
}

function getUserByToken(token) {
  if (!token) return null
  const s = sessions.get(token)
  if (!s) return null
  if (s.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }
  return s.userId
}

// 定期清理过期会话
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of sessions) {
    if (v.expiresAt < now) sessions.delete(k)
  }
}, 3600_000).unref()

// ============ 登录限速（IP 维度） ============
const MAX_ATTEMPTS = 5
const LOCK_MS = 60_000
const loginAttempts = new Map() // ip -> { count, lockedUntil }

function checkRateLimit(ip) {
  const rec = loginAttempts.get(ip)
  if (!rec) return { ok: true }
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) {
    return { ok: false, retryAfter: Math.ceil((rec.lockedUntil - Date.now()) / 1000) }
  }
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
    loginAttempts.delete(ip)
    return { ok: true }
  }
  return { ok: true }
}

function recordFailure(ip) {
  const rec = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 }
  rec.count += 1
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS
    rec.count = 0
  }
  loginAttempts.set(ip, rec)
}

function recordSuccess(ip) {
  loginAttempts.delete(ip)
}

// ============ 工具 ============
const VALID_USER_ID = /^[\w\u4e00-\u9fa5-]{2,50}$/

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(body))
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    let tooLarge = false
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 2 * 1024 * 1024) {
        tooLarge = true
        req.destroy()
      }
    })
    req.on('end', () => {
      if (tooLarge) return reject(new Error('body too large'))
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

// ============ 路由 ============
async function handleApi(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname
  const ip = req.socket.remoteAddress || 'unknown'

  try {
    const apiCtx = { pool, getUserByToken, sendJson, readBody }

    // ---------- 音乐 / 歌单 / 审核 ----------
    if (
      path.startsWith('/api/music') ||
      path.startsWith('/api/playlists') ||
      path.startsWith('/api/admin/music')
    ) {
      const handled = await handleMusicApi(req, res, apiCtx)
      if (handled !== undefined) return handled
    }

    // ---------- AI 配置与聊天 ----------
    if (path.startsWith('/api/ai')) {
      const handled = await handleAiApi(req, res, apiCtx)
      if (handled !== undefined) return handled
    }

    // ---------- 社区（聊天室/留言墙/用户/公告/目标） ----------
    if (
      path.startsWith('/api/chat') ||
      path.startsWith('/api/wall') ||
      path.startsWith('/api/users') ||
      path.startsWith('/api/announcements') ||
      path.startsWith('/api/goals') ||
      path.startsWith('/api/extras') ||
      path.startsWith('/api/admin/users')
    ) {
      const handled = await handleCommunityApi(req, res, apiCtx)
      if (handled !== undefined) return handled
    }

    // ---------- 多平台音乐搜索 ----------
    if (path.startsWith('/api/msearch')) {
      const handled = await handleMSearchApi(req, res, apiCtx)
      if (handled !== undefined) return handled
    }

    // ---------- B 站解析 ----------
    if (path.startsWith('/api/bili')) {
      const handled = await handleBiliApi(req, res, apiCtx)
      if (handled !== undefined) return handled
    }

    // ---------- 注册 ----------
    if (path === '/api/auth/register' && req.method === 'POST') {
      const { userId, password } = await readBody(req)
      const uid = String(userId ?? '').trim()
      const pwd = String(password ?? '')
      if (!VALID_USER_ID.test(uid)) {
        return sendJson(res, 400, { ok: false, message: '用户名需 2-50 位，仅限中文、字母、数字、下划线、连字符' })
      }
      if (pwd.length < 6 || pwd.length > 64) {
        return sendJson(res, 400, { ok: false, message: '密码需 6-64 位' })
      }
      const [rows] = await pool.query('SELECT user_id FROM rxy_web WHERE user_id = ?', [uid])
      if (rows.length > 0) {
        return sendJson(res, 409, { ok: false, message: '该用户名已被注册' })
      }
      await pool.query('INSERT INTO rxy_web (user_id, password) VALUES (?, ?)', [uid, hashPassword(pwd)])
      const token = createToken(uid)
      return sendJson(res, 200, { ok: true, token, userId: uid, message: '注册成功' })
    }

    // ---------- 登录 ----------
    if (path === '/api/auth/login' && req.method === 'POST') {
      const limit = checkRateLimit(ip)
      if (!limit.ok) {
        return sendJson(res, 429, { ok: false, message: `尝试过于频繁，请 ${limit.retryAfter} 秒后再试` })
      }
      const { userId, password } = await readBody(req)
      const uid = String(userId ?? '').trim()
      const pwd = String(password ?? '')
      const [rows] = await pool.query('SELECT password FROM rxy_web WHERE user_id = ?', [uid])
      if (rows.length === 0 || !verifyPassword(pwd, rows[0].password)) {
        recordFailure(ip)
        return sendJson(res, 401, { ok: false, message: '用户名或密码错误' })
      }
      recordSuccess(ip)
      const token = createToken(uid)
      return sendJson(res, 200, { ok: true, token, userId: uid, message: '登录成功' })
    }

    // ---------- 密码重置申请（需 root 审核） ----------
    if (path === '/api/auth/reset-request' && req.method === 'POST') {
      const { userId, newPassword } = await readBody(req)
      const uid = String(userId ?? '').trim()
      const pwd = String(newPassword ?? '')
      if (!VALID_USER_ID.test(uid)) return sendJson(res, 400, { ok: false, message: '用户名格式不正确' })
      if (pwd.length < 6 || pwd.length > 64) return sendJson(res, 400, { ok: false, message: '新密码需 6-64 位' })
      const [rows] = await pool.query('SELECT user_id FROM rxy_web WHERE user_id = ?', [uid])
      if (!rows.length) return sendJson(res, 404, { ok: false, message: '用户不存在' })
      // 防止刷屏：同一用户最多 3 条 pending
      const [pending] = await pool.query(
        "SELECT COUNT(*) AS c FROM password_resets WHERE user_id = ? AND status = 'pending'",
        [uid],
      )
      if (pending[0].c >= 3) return sendJson(res, 429, { ok: false, message: '待审核申请过多，请等待管理员处理' })
      await pool.query('INSERT INTO password_resets (user_id, new_hash) VALUES (?, ?)', [uid, hashPassword(pwd)])
      return sendJson(res, 200, { ok: true, message: '重置申请已提交，等待管理员审核' })
    }

    // ---------- 管理员：密码重置审核 ----------
    if (path === '/api/admin/resets' && req.method === 'GET') {
      const auth = req.headers.authorization || ''
      const userId = getUserByToken(auth.startsWith('Bearer ') ? auth.slice(7) : '')
      if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
      const [adminRows] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [userId])
      if (adminRows[0]?.role !== 'admin' && userId !== 'root') {
        return sendJson(res, 403, { ok: false, message: '仅管理员可操作' })
      }
      const [rows] = await pool.query(
        'SELECT id, user_id, status, created_at FROM password_resets ORDER BY (status = "pending") DESC, created_at DESC LIMIT 100',
      )
      return sendJson(res, 200, { ok: true, resets: rows })
    }
    const resetMatch = /^\/api\/admin\/resets\/(\d+)\/(approve|reject)$/.exec(path)
    if (resetMatch && req.method === 'POST') {
      const auth = req.headers.authorization || ''
      const userId = getUserByToken(auth.startsWith('Bearer ') ? auth.slice(7) : '')
      if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
      const [adminRows] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [userId])
      if (adminRows[0]?.role !== 'admin' && userId !== 'root') {
        return sendJson(res, 403, { ok: false, message: '仅管理员可操作' })
      }
      const resetId = Number(resetMatch[1])
      const action = resetMatch[2]
      const [[resetRow]] = await pool.query('SELECT id, user_id, new_hash, status FROM password_resets WHERE id = ?', [resetId])
      if (!resetRow) return sendJson(res, 404, { ok: false, message: '申请不存在' })
      if (resetRow.status !== 'pending') return sendJson(res, 400, { ok: false, message: '该申请已处理' })
      if (action === 'approve') {
        await pool.query('UPDATE rxy_web SET password = ? WHERE user_id = ?', [resetRow.new_hash, resetRow.user_id])
        await pool.query("UPDATE password_resets SET status = 'approved' WHERE id = ?", [resetId])
        return sendJson(res, 200, { ok: true, message: `已通过 ${resetRow.user_id} 的重置申请` })
      }
      await pool.query("UPDATE password_resets SET status = 'rejected' WHERE id = ?", [resetId])
      return sendJson(res, 200, { ok: true, message: `已拒绝 ${resetRow.user_id} 的重置申请` })
    }

    // ---------- 注销 ----------
    if (path === '/api/auth/logout' && req.method === 'POST') {
      const auth = req.headers.authorization || ''
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
      if (token) sessions.delete(token)
      return sendJson(res, 200, { ok: true })
    }

    // ---------- 数据读取 / 保存（需要 token） ----------
    if (path === '/api/data') {
      const auth = req.headers.authorization || ''
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
      const uid = getUserByToken(token)
      if (!uid) {
        return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
      }

      if (req.method === 'GET') {
        const [rows] = await pool.query('SELECT data FROM rxy_web_data WHERE user_id = ?', [uid])
        let data = null
        if (rows.length > 0 && rows[0].data) {
          try {
            data = JSON.parse(rows[0].data)
          } catch {
            data = null
          }
        }
        return sendJson(res, 200, { ok: true, data })
      }

      if (req.method === 'POST') {
        const body = await readBody(req)
        const payload = JSON.stringify({ tasks: body.tasks ?? [], progress: body.progress ?? null })
        if (payload.length > 2 * 1024 * 1024) {
          return sendJson(res, 413, { ok: false, message: '数据过大' })
        }
        await pool.query(
          'INSERT INTO rxy_web_data (user_id, data, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()',
          [uid, payload],
        )
        return sendJson(res, 200, { ok: true })
      }

      return sendJson(res, 405, { ok: false, message: 'Method Not Allowed' })
    }
  } catch (err) {
    console.error('[api] error:', err?.message || err)
    if (err?.message === 'invalid json') {
      return sendJson(res, 400, { ok: false, message: '请求格式错误' })
    }
    return sendJson(res, 500, { ok: false, message: '服务器错误，请确认 MySQL 已启动' })
  }

  // 非 API 路径放行
  return undefined
}

/** Vite 中间件：非 /api 路径直接 next() */
export function apiMiddleware(req, res, next) {
  const url = req.url || ''
  if (!url.startsWith('/api/')) {
    next()
    return
  }
  handleApi(req, res).catch(() => {
    /* 已在上层捕获 */
  })
}
