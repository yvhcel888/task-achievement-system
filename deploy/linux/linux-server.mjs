/**
 * 任务成就系统 - Linux 生产服务器（独立部署，无需 Vite）
 *
 * 功能：
 *  - 静态托管 dist/client 构建产物（SPA fallback 到 index.html）
 *  - 挂载 /api/* 认证与数据接口（复用 server/api.mjs）
 *  - 应答 client-toolkit 的 get_published / observability 探测接口，消除控制台噪音
 *
 * 配置（环境变量或同目录 .env 文件）：
 *  - PORT        监听端口，默认 8889
 *  - DB_HOST     MySQL 地址，默认 127.0.0.1
 *  - DB_PORT     MySQL 端口，默认 3306
 *  - DB_USER     MySQL 用户，默认 root
 *  - DB_PASSWORD MySQL 密码
 *  - DB_NAME     数据库名，默认 rxy
 *
 * 启动：node linux-server.mjs   （生产环境请先 npm run build）
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============ 加载 .env（同目录，简单解析：支持 # 注释 与 引号值） ============
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    let key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile()

// 必须在 .env 加载之后导入（api.mjs 读取 DB_* 环境变量创建连接池）
const { apiMiddleware } = await import('../../server/api.mjs')

const PORT = Number(process.env.PORT || 8889)
const DIST_DIR = path.resolve(__dirname, '../../dist/client')

// ============ 静态资源 MIME ============
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(body))
  res.end(body)
}

// 运行时占位符替换（与 vite.config.ts 的 miaodaStandalonePatch 一致）：
// 生产服务器静态托管 dist 时，index.html 里 {{appId}}/{{basename}} 等占位符
// 若不替换，window.__BASENAME__ = "{{basename}}" 会成为 truthy 值，
// 导致 React Router 所有路由失配、页面白屏（vite preview 有中间件替换，生产版必须自己处理）。
function replaceViewContextPlaceholders(html) {
  return html
    .replace(/{{appId}}/g, '')
    .replace(/{{basename}}/g, '/')
    .replace(/{{environment}}/g, 'online')
    .replace(/{{userId}}/g, '')
    .replace(/{{tenantId}}/g, '')
    .replace(/{{userName}}/g, '')
    .replace(/{{csrfToken}}/g, '')
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 404
      res.end('Not Found')
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    // HTML 文件做运行时占位符替换
    let body = content
    if (ext === '.html') {
      body = Buffer.from(replaceViewContextPlaceholders(content.toString('utf8')), 'utf8')
    }
    res.statusCode = 200
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
    res.setHeader('Content-Length', body.length)
    res.end(body)
  })
}

// ============ 静态服务 + SPA fallback ============
function staticHandler(req, res, next) {
  const url = new URL(req.url, 'http://localhost')
  let pathname = decodeURIComponent(url.pathname)

  if (pathname === '/') pathname = '/index.html'

  // 子工具目录（/tools/sql2er/ 等独立构建的纯前端工具）
  if (pathname.startsWith('/tools/')) {
    const TOOLS_DIR = path.resolve(__dirname, '../../tools')
    let p = pathname.replace(/^\/tools\//, '')
    if (!p || p.endsWith('/')) p += 'index.html'
    const filePath = path.normalize(path.join(TOOLS_DIR, p))
    if (!filePath.startsWith(TOOLS_DIR)) {
      res.statusCode = 403
      res.end('Forbidden')
      return
    }
    sendFile(res, filePath)
    return
  }

  // 3D 模型库（/models/ 静态资源,glb/models.json）
  if (pathname.startsWith('/models/')) {
    const MODELS_DIR = path.resolve(__dirname, '../../models')
    let p = pathname.replace(/^\/models\//, '')
    if (!p || p.endsWith('/')) p += 'index.html'
    const filePath = path.normalize(path.join(MODELS_DIR, p))
    if (!filePath.startsWith(MODELS_DIR)) {
      res.statusCode = 403
      res.end('Forbidden')
      return
    }
    sendFile(res, filePath)
    return
  }

  // 静态文件（带扩展名）直接读；无扩展名路径做 SPA fallback
  const ext = path.extname(pathname).toLowerCase()
  let filePath
  if (ext) {
    filePath = path.normalize(path.join(DIST_DIR, pathname))
  } else {
    filePath = path.join(DIST_DIR, 'index.html')
  }
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }
  sendFile(res, filePath)
}

// ============ client-toolkit 宿主探测接口应答（独立部署无宿主） ============
const APP_NAME = '任务成就激励系统 · BP Achievement'
const APP_DESCRIPTION =
  '任务成就激励系统 - 每完成一个任务，解锁新成就，追踪你的成长路径'

function toolkitHandler(req, res, next) {
  const url = new URL(req.url, 'http://localhost').pathname
  if (url.includes('/get_published')) {
    sendJson(res, 200, {
      code: 0,
      data: {
        app_info: {
          app_name: APP_NAME,
          app_description: APP_DESCRIPTION,
          app_avatar: '/favicon.svg',
          show_badge: false,
        },
      },
    })
    return
  }
  if (url.includes('current_server_timestamp')) {
    sendJson(res, 200, {
      code: 0,
      data: { timestampNs: String(BigInt(Date.now()) * BigInt(1e6)) },
    })
    return
  }
  if (url.includes('/observability/')) {
    sendJson(res, 200, { code: 0 })
    return
  }
  next()
}

// ============ 主服务器 ============
const server = http.createServer((req, res) => {
  const url = req.url || ''

  // 1. API 接口
  if (url.startsWith('/api/')) {
    apiMiddleware(req, res, () => {
      sendJson(res, 404, { ok: false, message: 'Not Found' })
    })
    return
  }

  // 2. 宿主探测接口
  toolkitHandler(req, res, () => {
    // 3. 静态资源
    staticHandler(req, res, () => {
      res.statusCode = 404
      res.end('Not Found')
    })
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[task-achievement] 服务器已启动: http://0.0.0.0:${PORT}`)
  console.log(`[task-achievement] 静态目录: ${DIST_DIR}`)
  console.log(
    `[task-achievement] MySQL: ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'rxy'} (用户: ${process.env.DB_USER || 'root'})`,
  )
})
