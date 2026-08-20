import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Vite 中间件：处理 /api/* 请求（注册/登录/数据读写），
 * 非 API 路径调用 next() 放行。
 */
export function apiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void
