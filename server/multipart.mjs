// multipart/form-data 解析（内存版，适合音乐等中大型文件）
import { randomBytes } from 'node:crypto'

export async function parseMultipart(req, { maxSize = 300 * 1024 * 1024 } = {}) {
  const contentType = req.headers['content-type'] || ''
  const m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!m) throw new Error('no boundary')

  const chunks = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > maxSize) throw new Error('body too large')
    chunks.push(chunk)
  }
  const buf = Buffer.concat(chunks)

  const parts = []
  const delim = Buffer.from(`--${m[1] || m[2]}`)
  const CRLF = Buffer.from('\r\n')
  let pos = 0

  for (;;) {
    const start = buf.indexOf(delim, pos)
    if (start === -1) break
    // 跳过行尾（\r\n 或 -- 结束符）
    let cursor = start + delim.length
    if (buf[cursor] === 45 && buf[cursor + 1] === 45) break // 末尾 --
    if (buf[cursor] === 13 && buf[cursor + 1] === 10) cursor += 2
    const headerEnd = buf.indexOf(Buffer.from('\r\n\r\n'), cursor)
    if (headerEnd === -1) break
    const headerStr = buf.slice(cursor, headerEnd).toString('utf8')
    const dataStart = headerEnd + 4
    const nextDelim = buf.indexOf(delim, dataStart)
    if (nextDelim === -1) break
    let dataEnd = nextDelim
    if (dataEnd >= 2 && buf[dataEnd - 2] === 13 && buf[dataEnd - 1] === 10) dataEnd -= 2

    const nameMatch = headerStr.match(/name="([^"]+)"/)
    const filenameMatch = headerStr.match(/filename="([^"]+)"/)
    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch ? filenameMatch[1] : null,
        data: buf.slice(dataStart, dataEnd),
      })
    }
    pos = nextDelim
  }
  return parts
}

export function genId() {
  return `${Date.now().toString(36)}${randomBytes(6).toString('hex')}`
}
