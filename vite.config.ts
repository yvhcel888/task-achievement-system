import fs from 'fs'
import path from 'path'
import { defineConfig } from '@lark-apaas/coding-preset-vite-react'
import type { Plugin } from 'vite'
import { apiMiddleware } from './server/api.mjs'

const APP_NAME = '任务成就激励系统 · BP Achievement'
const APP_DESCRIPTION =
  '任务成就激励系统 - 每完成一个任务，解锁新成就，追踪你的成长路径'
const APP_AVATAR = '/favicon.svg'

/**
 * 独立部署补丁：
 * 1. 预设的 ogMetaPlugin 会把 <title>/description/favicon 写成 {{appName}} 等 HBS 占位符，
 *    本插件在最后一步替换为真实值（dev / build 均生效，Lark 部署时其余运行时变量不受影响）。
 * 2. 独立运行（无飞书/妙搭宿主）时，client-toolkit 的 AppContainer 会请求 get_published
 *    接口拿应用信息，裸服务器会返回 index.html 导致 JSON 解析报错（控制台噪音）。
 *    dev server / preview server 中间件直接应答合法 JSON，消除报错并恢复正确标题。
 * 3. preview server 额外把产物 HTML 里剩余的运行时占位符（{{appId}} 等）改写为
 *    本地空值，使 dist 静态预览与 dev 行为完全一致；产物文件本身保持原样，
 *    将来上妙搭/Lark 平台部署时平台侧替换不受影响。
 */
function miaodaStandalonePatch(): Plugin {
  const replaceViewContextPlaceholders = (html: string) =>
    html
      .replace(/{{appId}}/g, '')
      .replace(/{{basename}}/g, '/')
      .replace(/{{environment}}/g, 'online')
      .replace(/{{userId}}/g, '')
      .replace(/{{tenantId}}/g, '')
      .replace(/{{userName}}/g, '')
      .replace(/{{csrfToken}}/g, '')

  const replaceStaticPlaceholders = (html: string) =>
    html
      .replace(/\{\{appName\}\}/g, APP_NAME)
      .replace(/\{\{appDescription\}\}/g, APP_DESCRIPTION)
      .replace(/\{\{appAvatar\}\}/g, APP_AVATAR)

  const handleGetPublished = (
    req: { url?: string },
    res: {
      setHeader: (k: string, v: string) => void
      end: (body: string) => void
    },
    next: () => void,
  ) => {
    const url = req.url ?? ''
    if (url.includes('/get_published')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          code: 0,
          data: {
            app_info: {
              app_name: APP_NAME,
              app_description: APP_DESCRIPTION,
              app_avatar: APP_AVATAR,
              // 独立部署时隐藏「由妙搭搭建」角标
              show_badge: false,
            },
          },
        }),
      )
      return
    }
    // 可观测 SDK 的服务器时间校准接口
    if (url.includes('current_server_timestamp')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          code: 0,
          data: { timestampNs: String(BigInt(Date.now()) * BigInt(1e6)) },
        }),
      )
      return
    }
    // 可观测 SDK 的日志/链路/指标采集接口
    if (url.includes('/observability/')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ code: 0 }))
      return
    }
    next()
  }

  return {
    name: 'miaoda-standalone-patch',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return replaceStaticPlaceholders(html)
      },
    },
    configureServer(server) {
      server.middlewares.use(apiMiddleware)
      server.middlewares.use(handleGetPublished)
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware)
      server.middlewares.use(handleGetPublished)
      // 静态预览时改写产物 index.html 里的运行时占位符
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (url === '/' || url === '/index.html') {
          const indexPath = path.resolve(__dirname, 'dist/client/index.html')
          fs.readFile(indexPath, 'utf8', (err, html) => {
            if (err) return next()
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(replaceViewContextPlaceholders(html))
          })
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  plugins: [miaodaStandalonePatch()],
})
