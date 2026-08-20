// 社区模块：聊天室 / 留言墙 / 用户广场 / 公告 / 管理员任命 / 目标与奖励
const RATE = new Map() // 发言频率限制（内存）

export async function handleCommunityApi(req, res, { pool, getUserByToken, sendJson, readBody }) {
  const url = new URL(req.url, 'http://x')
  const pathname = url.pathname
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const userId = getUserByToken(token)

  const authUser = async () => {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    return null
  }
  const getRole = async (uid) => {
    const [[row]] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [uid])
    return row?.role || 'user'
  }
  const isAdminUser = async (uid) => {
    const role = await getRole(uid)
    return role === 'admin'
  }
  const rateLimit = (uid, gapMs = 3000) => {
    const now = Date.now()
    const last = RATE.get(uid) || 0
    if (now - last < gapMs) return true
    RATE.set(uid, now)
    return false
  }
  const safeParse = (s) => {
    try { return JSON.parse(s || '{}') } catch { return {} }
  }

  // ============ 聊天室 ============
  if (pathname === '/api/chat' && req.method === 'GET') {
    const after = Number(url.searchParams.get('after') || 0)
    const [rows] = await pool.query(
      'SELECT id, user_id, content, created_at FROM chat_messages WHERE id > ? ORDER BY id ASC LIMIT 100',
      [after],
    )
    return sendJson(res, 200, { ok: true, messages: rows })
  }

  // 删除聊天消息（本人或 root/admin）
  const chatDel = /^\/api\/chat\/(\d+)$/.exec(pathname)
  if (chatDel && req.method === 'DELETE') {
    const denied = await authUser()
    if (denied) return denied
    const msgId = Number(chatDel[1])
    const [rows] = await pool.query('SELECT user_id FROM chat_messages WHERE id = ?', [msgId])
    if (!rows.length) return sendJson(res, 404, { ok: false, message: '消息不存在或已删除' })
    const isOwner = rows[0].user_id === userId
    const [adminRows] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [userId])
    const isAdmin = adminRows[0]?.role === 'admin'
    if (!isOwner && !isAdmin) return sendJson(res, 403, { ok: false, message: '只能删除自己发的消息' })
    await pool.query('DELETE FROM chat_messages WHERE id = ?', [msgId])
    return sendJson(res, 200, { ok: true, message: '已删除' })
  }
  if (pathname === '/api/chat' && req.method === 'POST') {
    const denied = await authUser()
    if (denied) return denied
    const body = await readBody(req)
    const content = String(body.content || '').trim()
    if (!content) return sendJson(res, 400, { ok: false, message: '内容不能为空' })
    if (content.length > 500) return sendJson(res, 400, { ok: false, message: '最多 500 字' })
    if (rateLimit(`chat:${userId}`)) return sendJson(res, 429, { ok: false, message: '发言太快啦，歇口气再聊' })
    const [r] = await pool.query('INSERT INTO chat_messages (user_id, content) VALUES (?, ?)', [userId, content.slice(0, 500)])
    return sendJson(res, 200, { ok: true, id: r.insertId, user_id: userId, content, created_at: new Date() })
  }

  // ============ 留言墙 ============
  if (pathname === '/api/wall' && req.method === 'GET') {
    const [rows] = await pool.query('SELECT id, user_id, content, created_at FROM wall_messages ORDER BY id DESC LIMIT 100')
    return sendJson(res, 200, { ok: true, messages: rows })
  }
  if (pathname === '/api/wall' && req.method === 'POST') {
    const denied = await authUser()
    if (denied) return denied
    const body = await readBody(req)
    const content = String(body.content || '').trim()
    if (!content) return sendJson(res, 400, { ok: false, message: '内容不能为空' })
    if (content.length > 500) return sendJson(res, 400, { ok: false, message: '最多 500 字' })
    if (rateLimit(`wall:${userId}`, 2000)) return sendJson(res, 429, { ok: false, message: '留言太频繁啦' })
    const [r] = await pool.query('INSERT INTO wall_messages (user_id, content) VALUES (?, ?)', [userId, content.slice(0, 500)])
    return sendJson(res, 200, { ok: true, id: r.insertId })
  }
  const wallDel = /^\/api\/wall\/(\d+)$/.exec(pathname)
  if (wallDel && req.method === 'DELETE') {
    const denied = await authUser()
    if (denied) return denied
    const [[row]] = await pool.query('SELECT user_id FROM wall_messages WHERE id = ?', [wallDel[1]])
    if (!row) return sendJson(res, 404, { ok: false, message: '留言不存在' })
    if (row.user_id !== userId && !(await isAdminUser(userId))) {
      return sendJson(res, 403, { ok: false, message: '仅本人或管理员可删除' })
    }
    await pool.query('DELETE FROM wall_messages WHERE id = ?', [wallDel[1]])
    return sendJson(res, 200, { ok: true, message: '已删除' })
  }

  // ============ 用户广场 ============
  if (pathname === '/api/users' && req.method === 'GET') {
    const denied = await authUser()
    if (denied) return denied
    const [rows] = await pool.query(
      `SELECT w.user_id, w.role, d.data, d.updated_at
       FROM rxy_web w LEFT JOIN rxy_web_data d ON d.user_id = w.user_id
       ORDER BY w.user_id ASC`,
    )
    const users = rows.map((r) => {
      const p = safeParse(r.data).progress || {}
      return {
        user_id: r.user_id,
        role: r.role || 'user',
        totalTasks: p.totalTasks ?? 0,
        totalPoints: p.totalPoints ?? 0,
        level: p.level ?? 1,
        achievements: Array.isArray(p.achievements) ? p.achievements.length : 0,
        equippedTitle: p.equippedTitle || null,
        lastActive: r.updated_at || null,
      }
    })
    return sendJson(res, 200, { ok: true, users })
  }

  // ============ 公告 ============
  if (pathname === '/api/announcements' && req.method === 'GET') {
    const [rows] = await pool.query('SELECT id, user_id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 20')
    return sendJson(res, 200, { ok: true, announcements: rows })
  }
  if (pathname === '/api/announcements' && req.method === 'POST') {
    const denied = await authUser()
    if (denied) return denied
    if (!(await isAdminUser(userId))) return sendJson(res, 403, { ok: false, message: '仅管理员可发公告' })
    const body = await readBody(req)
    const title = String(body.title || '').trim().slice(0, 100)
    const content = String(body.content || '').trim().slice(0, 1000)
    if (!title || !content) return sendJson(res, 400, { ok: false, message: '标题和内容不能为空' })
    const [r] = await pool.query('INSERT INTO announcements (user_id, title, content, pinned) VALUES (?, ?, ?, ?)', [
      userId, title, content, body.pinned ? 1 : 0,
    ])
    return sendJson(res, 200, { ok: true, id: r.insertId })
  }
  const annDel = /^\/api\/announcements\/(\d+)$/.exec(pathname)
  if (annDel && req.method === 'DELETE') {
    const denied = await authUser()
    if (denied) return denied
    if (!(await isAdminUser(userId))) return sendJson(res, 403, { ok: false, message: '仅管理员可删除公告' })
    await pool.query('DELETE FROM announcements WHERE id = ?', [annDel[1]])
    return sendJson(res, 200, { ok: true, message: '已删除' })
  }

  // ============ 管理员任命（root） ============
  const roleMatch = /^\/api\/admin\/users\/([^/]+)\/role$/.exec(pathname)
  if (roleMatch && req.method === 'POST') {
    const denied = await authUser()
    if (denied) return denied
    if (userId !== 'root') return sendJson(res, 403, { ok: false, message: '仅 root 可任命管理员' })
    const body = await readBody(req)
    const target = roleMatch[1]
    const role = body.role === 'admin' ? 'admin' : 'user'
    const [r] = await pool.query('UPDATE rxy_web SET role = ? WHERE user_id = ?', [role, target])
    if (r.affectedRows === 0) return sendJson(res, 404, { ok: false, message: '用户不存在' })
    return sendJson(res, 200, { ok: true, message: role === 'admin' ? `已将 ${target} 任命为管理员` : `已撤销 ${target} 的管理员身份` })
  }

  // ============ 目标与奖励 ============
  if (pathname === '/api/goals' && req.method === 'GET') {
    const denied = await authUser()
    if (denied) return denied
    const [rows] = await pool.query("SELECT * FROM goals WHERE user_id = ? ORDER BY (status = 'achieved'), created_at DESC", [userId])
    return sendJson(res, 200, { ok: true, goals: rows })
  }
  if (pathname === '/api/goals' && req.method === 'POST') {
    const denied = await authUser()
    if (denied) return denied
    const body = await readBody(req)
    const title = String(body.title || '').trim().slice(0, 200)
    const reward = String(body.reward || '').trim().slice(0, 200)
    if (!title || !reward) return sendJson(res, 400, { ok: false, message: '目标和奖励不能为空' })
    const targetTasks = Math.max(0, Number(body.targetTasks) || 0)
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    await pool.query('INSERT INTO goals (id, user_id, title, reward, target_tasks) VALUES (?, ?, ?, ?, ?)', [
      id, userId, title, reward, targetTasks,
    ])
    return sendJson(res, 200, { ok: true, id, message: '目标已设立，冲鸭！' })
  }
  const goalOp = /^\/api\/goals\/([^/]+)\/(achieve|abandon)$/.exec(pathname)
  if (goalOp && req.method === 'POST') {
    const denied = await authUser()
    if (denied) return denied
    const [[row]] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [goalOp[1], userId])
    if (!row) return sendJson(res, 404, { ok: false, message: '目标不存在' })
    if (goalOp[2] === 'achieve') {
      await pool.query('UPDATE goals SET status = "achieved", achieved_at = NOW() WHERE id = ?', [goalOp[1]])
      return sendJson(res, 200, { ok: true, message: `🎉 恭喜达成目标！去奖励自己吧：${row.reward}` })
    }
    await pool.query('UPDATE goals SET status = "abandoned" WHERE id = ?', [goalOp[1]])
    return sendJson(res, 200, { ok: true, message: '目标已放弃，别灰心，重新立一个' })
  }
  const goalDel = /^\/api\/goals\/([^/]+)$/.exec(pathname)
  if (goalDel && req.method === 'DELETE') {
    const denied = await authUser()
    if (denied) return denied
    await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [goalDel[1], userId])
    return sendJson(res, 200, { ok: true, message: '目标已删除' })
  }

  // ============ 通用扩展存储（生活/工具功能） ============
  if (pathname === '/api/extras' && req.method === 'GET') {
    const denied = await authUser()
    if (denied) return denied
    const kind = String(url.searchParams.get('kind') || '')
    if (!kind) return sendJson(res, 400, { ok: false, message: '缺少 kind 参数' })
    const [rows] = await pool.query('SELECT id, kind, payload, created_at, updated_at FROM extras WHERE user_id = ? AND kind = ? ORDER BY id DESC LIMIT 500', [userId, kind])
    return sendJson(res, 200, {
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        ...(typeof r.payload === 'string' ? safeParse(r.payload) : r.payload || {}),
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
    })
  }
  if (pathname === '/api/extras' && req.method === 'POST') {
    const denied = await authUser()
    if (denied) return denied
    const body = await readBody(req)
    const kind = String(body.kind || '').trim().slice(0, 50)
    const payload = body.payload ?? {}
    if (!kind) return sendJson(res, 400, { ok: false, message: '缺少 kind 参数' })
    const [r] = await pool.query('INSERT INTO extras (user_id, kind, payload) VALUES (?, ?, ?)', [userId, kind, JSON.stringify(payload)])
    return sendJson(res, 200, { ok: true, id: r.insertId })
  }
  const extrasDel = /^\/api\/extras\/(\d+)$/.exec(pathname)
  if (extrasDel && req.method === 'DELETE') {
    const denied = await authUser()
    if (denied) return denied
    await pool.query('DELETE FROM extras WHERE id = ? AND user_id = ?', [extrasDel[1], userId])
    return sendJson(res, 200, { ok: true, message: '已删除' })
  }

  return sendJson(res, 404, { ok: false, message: '接口不存在' })
}
