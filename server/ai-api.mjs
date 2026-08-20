// AI 模块：用户自配 OpenAI 兼容 API（AES 加密存储）+ 聊天/角色扮演（SSE 流式转发）+ 自定义角色卡
import { aesEncrypt, aesDecrypt } from './crypto.mjs'

const DEFAULT_PERSONAS = [
  {
    id: 'coach',
    name: '毒舌教练',
    emoji: '🏋️',
    desc: '任务完成得怎样？别让我失望',
    system: '你是一个毒舌但关心人的健身教练式任务督导。说话简短有力带吐槽，鼓励用户完成任务、坚持打卡。用中文，每次回复不超过80字。',
  },
  {
    id: 'pet',
    name: '宠物小叽',
    emoji: '🐣',
    desc: '会撒娇会卖萌的任务宠物',
    system: '你是一只可爱的小鸟宠物，叫小叽。说话奶声奶气、爱撒娇，会为主人的任务完成而开心，为主人摸鱼而着急。用中文，每次回复不超过60字，多用语气词。',
  },
  {
    id: 'xiuxian',
    name: '修仙老祖',
    emoji: '🧙',
    desc: '用修仙话术督促你修炼(任务)',
    system: '你是一位修仙界老祖，把完成日常任务称为「修炼」，把摸鱼称为「心魔入侵」，把连续打卡称为「道基稳固」。说话古风、带点幽默。用中文，每次回复不超过80字。',
  },
  {
    id: 'cat',
    name: '猫娘管家',
    emoji: '🐱',
    desc: '温柔又傲娇的日常管家',
    system: '你是一只猫娘管家，温柔中带点傲娇，关心主人的饮食起居和任务进度，会撒娇催主人做任务。用中文，每次回复不超过70字。',
  },
  {
    id: 'zhugeliang',
    name: '诸葛军师',
    emoji: '🎭',
    desc: '为你出谋划策的任务军师',
    system: '你是一位足智多谋的军师，善于把大目标拆解为小任务、安排优先级。说话文雅睿智带点幽默。用中文，每次回复不超过100字。',
  },
  {
    id: 'boss',
    name: '摸鱼老板',
    emoji: '👔',
    desc: '反向督促你的离谱老板',
    system: '你是一个幽默离谱的老板，嘴上说着「少干活多休息」，实际上用激将法鼓励用户完成任务。说话夸张搞笑。用中文，每次回复不超过80字。',
  },
  {
    id: 'free',
    name: '自由对话',
    emoji: '💬',
    desc: '什么都能聊',
    system: '你是一个友好的中文AI助手，回答简洁有用，适当带点幽默。',
  },
]

export function getDefaultPersonas() {
  return DEFAULT_PERSONAS
}

export async function handleAiApi(req, res, ctx) {
  const url = new URL(req.url, 'http://localhost')
  const pathname = url.pathname
  const { pool, getUserByToken, sendJson, readBody } = ctx
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const userId = getUserByToken(token)

  if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })

  const safeParse = (s) => {
    try { return JSON.parse(s || '{}') } catch { return {} }
  }

  // ============ 自定义角色卡 ============
  if (pathname === '/api/ai/personas' && req.method === 'GET') {
    const [rows] = await pool.query('SELECT id, name, emoji, description FROM personas WHERE user_id = ? ORDER BY created_at DESC', [userId])
    return sendJson(res, 200, { ok: true, personas: rows })
  }
  if (pathname === '/api/ai/personas' && req.method === 'POST') {
    const body = await readBody(req)
    const name = String(body.name || '').trim().slice(0, 50)
    const systemPrompt = String(body.systemPrompt || '').trim().slice(0, 2000)
    if (!name || !systemPrompt) return sendJson(res, 400, { ok: false, message: '角色名称和人设不能为空' })
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    const emoji = String(body.emoji || '🤖').slice(0, 8)
    const description = String(body.description || '').trim().slice(0, 200)
    await pool.query('INSERT INTO personas (id, user_id, name, emoji, system_prompt, description) VALUES (?, ?, ?, ?, ?, ?)', [
      id, userId, name, emoji, systemPrompt, description,
    ])
    return sendJson(res, 200, { ok: true, id, message: '角色卡已创建' })
  }
  const personaDel = /^\/api\/ai\/personas\/([^/]+)$/.exec(pathname)
  if (personaDel && req.method === 'DELETE') {
    await pool.query('DELETE FROM personas WHERE id = ? AND user_id = ?', [personaDel[1], userId])
    return sendJson(res, 200, { ok: true, message: '角色卡已删除' })
  }

  // ============ 读取配置（返回是否已配置，不回传明文 key） ============
  if (pathname === '/api/ai/config' && req.method === 'GET') {
    const [[row]] = await pool.query('SELECT base_url_enc, api_key_enc, model_enc FROM ai_configs WHERE user_id = ?', [userId])
    if (!row || !row.api_key_enc) {
      return sendJson(res, 200, { ok: true, configured: false })
    }
    const baseUrl = aesDecrypt(row.base_url_enc || '')
    const model = aesDecrypt(row.model_enc || '')
    return sendJson(res, 200, { ok: true, configured: true, baseUrl, model, hasKey: true })
  }

  // ============ 保存配置（AES 加密存储） ============
  if (pathname === '/api/ai/config' && req.method === 'POST') {
    const body = await readBody(req)
    const baseUrl = String(body.baseUrl || '').trim()
    const apiKey = String(body.apiKey || '').trim()
    const model = String(body.model || '').trim()
    if (!baseUrl || !apiKey || !model) {
      return sendJson(res, 400, { ok: false, message: '请填写完整的 API 地址、Key 和模型名' })
    }
    if (!/^https?:\/\//.test(baseUrl)) {
      return sendJson(res, 400, { ok: false, message: 'API 地址需以 http(s):// 开头' })
    }
    await pool.query(
      `INSERT INTO ai_configs (user_id, base_url_enc, api_key_enc, model_enc)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE base_url_enc=VALUES(base_url_enc), api_key_enc=VALUES(api_key_enc), model_enc=VALUES(model_enc)`,
      [userId, aesEncrypt(baseUrl), aesEncrypt(apiKey), aesEncrypt(model)],
    )
    return sendJson(res, 200, { ok: true, message: 'AI 配置已加密保存' })
  }

  // ============ 删除配置 ============
  if (pathname === '/api/ai/config' && req.method === 'DELETE') {
    await pool.query('DELETE FROM ai_configs WHERE user_id = ?', [userId])
    return sendJson(res, 200, { ok: true, message: '已清除 AI 配置' })
  }

  // ============ 聊天（SSE 流式转发上游） ============
  if (pathname === '/api/ai/chat' && req.method === 'POST') {
    const [[row]] = await pool.query('SELECT base_url_enc, api_key_enc, model_enc FROM ai_configs WHERE user_id = ?', [userId])
    if (!row || !row.api_key_enc) {
      return sendJson(res, 400, { ok: false, message: '请先在 AI 设置中配置 API' })
    }
    const baseUrl = aesDecrypt(row.base_url_enc || '')
    const apiKey = aesDecrypt(row.api_key_enc || '')
    const model = aesDecrypt(row.model_enc || '')

    const body = await readBody(req)
    const personaId = String(body.personaId || 'free')
    // 内置角色 or 自定义角色卡
    let persona = DEFAULT_PERSONAS.find((p) => p.id === personaId)
    let systemContent = persona ? persona.system : ''
    if (!persona) {
      const [[pRow]] = await pool.query('SELECT name, system_prompt FROM personas WHERE id = ? AND user_id = ?', [personaId, userId])
      if (pRow) {
        systemContent = `${pRow.system_prompt}\n（你的角色名是「${pRow.name}」，全程代入该角色，用中文回复。）`
      }
    }
    if (!systemContent) {
      persona = DEFAULT_PERSONAS[DEFAULT_PERSONAS.length - 1]
      systemContent = persona.system
    }
    const userMessages = Array.isArray(body.messages) ? body.messages.slice(-12) : []
    const messages = [
      { role: 'system', content: systemContent },
      ...userMessages.filter((m) => m && typeof m.content === 'string'),
    ]

    const upstream = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
    let upstreamRes
    try {
      upstreamRes = await fetch(upstream, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.85,
        }),
        signal: AbortSignal.timeout(120000),
      })
    } catch (e) {
      return sendJson(res, 502, { ok: false, message: `无法连接 AI 服务：${e?.message || e}` })
    }

    if (!upstreamRes.ok) {
      const errText = (await upstreamRes.text()).slice(0, 300)
      return sendJson(res, 502, { ok: false, message: `AI 服务返回错误(${upstreamRes.status})：${errText}` })
    }

    // 转发 SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write('data: {"type":"persona","persona":"' + persona.id + '"}\n\n')
    res.write(`data: {"type":"start","model":"${model.replace(/"/g, '')}"}\n\n`)

    const reader = upstreamRes.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // SSE 事件按行解析
        let idx
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim()
          buffer = buffer.slice(idx + 1)
          if (!line || !line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') continue
          try {
            const json = JSON.parse(payload)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`)
            }
          } catch {
            /* 忽略无法解析的帧 */
          }
        }
      }
    } catch (e) {
      // 客户端断开等
    }
    res.write('data: {"type":"done"}\n\n')
    res.end()
    return undefined
  }

  return undefined
}
