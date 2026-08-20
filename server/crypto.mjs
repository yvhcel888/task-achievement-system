// AES-256-GCM 加解密（密钥从环境变量 APP_KEY 读取,sha256 派生）
// 密文格式：iv:tag:ciphertext (hex)
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const APP_KEY = process.env.APP_KEY || 'change-me-in-production'
const KEY = createHash('sha256').update(APP_KEY).digest()

export function aesEncrypt(plain) {
  if (!plain) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', KEY, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function aesDecrypt(cipherText) {
  if (!cipherText) return ''
  try {
    const [ivHex, tagHex, dataHex] = cipherText.split(':')
    if (!ivHex || !tagHex || !dataHex) return ''
    const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
    return dec.toString('utf8')
  } catch {
    return ''
  }
}
