// 音乐模块：上传(MD5去重) / 审核(root) / 歌单 / 流式播放(Range)
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { parseMultipart, genId } from './multipart.mjs'

// 6 位分享码（去除易混淆字符）
function genShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/music')

function ensureDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

function md5Of(buf) {
  return createHash('md5').update(buf).digest('hex')
}

function extOf(filename) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename || '')
  return m ? m[1].toLowerCase() : 'mp3'
}

function isAdminRow(row) {
  return row?.role === 'admin'
}

/** 权限：approved 所有人可听；pending/rejected 仅上传者与 root */
function canListen(song, userId, isAdmin) {
  return song.status === 'approved' || (userId != null && (song.user_id === userId || isAdmin))
}

export async function handleMusicApi(req, res, ctx) {
  const url = new URL(req.url, 'http://localhost')
  const pathname = url.pathname
  const { pool, getUserByToken, sendJson, readBody } = ctx
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const userId = getUserByToken(token)

  // ============ 删除歌曲（root 可删任意；上传者可删自己的） ============
  const delMatch = /^\/api\/music\/([^/]+)$/.exec(pathname)
  if (delMatch && req.method === 'DELETE') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [[me]] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [userId])
    const isAdmin = isAdminRow(me)
    const [[song]] = await pool.query('SELECT * FROM music WHERE song_id = ?', [delMatch[1]])
    if (!song) return sendJson(res, 404, { ok: false, message: '歌曲不存在' })
    if (song.user_id !== userId && !isAdmin) {
      return sendJson(res, 403, { ok: false, message: '仅上传者或 root 可删除' })
    }
    try {
      fs.unlinkSync(path.join(UPLOAD_DIR, `${song.song_id}.${song.ext}`))
    } catch {
      /* 文件可能已缺失 */
    }
    await pool.query('DELETE FROM playlist_songs WHERE song_id = ?', [song.song_id])
    await pool.query('DELETE FROM music WHERE song_id = ?', [song.song_id])
    return sendJson(res, 200, { ok: true, message: `已删除《${song.title}》` })
  }

  // ============ 歌曲列表 ============
  if (pathname === '/api/music' && req.method === 'GET') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [rows] = await pool.query(
      `SELECT song_id, user_id, title, artist, ext, filename, size, status, created_at
       FROM music WHERE status='approved' OR user_id=? ORDER BY created_at DESC`,
      [userId],
    )
    // 过滤：pending/rejected 仅本人可见（已由 SQL 限定）
    return sendJson(res, 200, { ok: true, songs: rows })
  }

  // ============ 我的上传 ============
  if (pathname === '/api/music/mine' && req.method === 'GET') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [rows] = await pool.query(
      `SELECT song_id, user_id, title, artist, ext, filename, size, status, created_at
       FROM music WHERE user_id=? ORDER BY created_at DESC`,
      [userId],
    )
    return sendJson(res, 200, { ok: true, songs: rows })
  }

  // ============ 上传（multipart：file + title + artist） ============
  if (pathname === '/api/music/upload' && req.method === 'POST') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    let parts
    try {
      parts = await parseMultipart(req)
    } catch (e) {
      return sendJson(res, 400, { ok: false, message: '上传数据解析失败' })
    }
    const filePart = parts.find((p) => p.name === 'file' && p.data.length > 0)
    if (!filePart) return sendJson(res, 400, { ok: false, message: '未选择文件' })

    const titlePart = parts.find((p) => p.name === 'title')
    const artistPart = parts.find((p) => p.name === 'artist')
    const title = (titlePart?.data.toString('utf8') || '').trim() || '未命名歌曲'
    const artist = (artistPart?.data.toString('utf8') || '').trim() || '未知歌手'

    const md5 = md5Of(filePart.data)
    const ext = extOf(filePart.filename || '')
    if (!['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
      return sendJson(res, 400, { ok: false, message: '不支持的音频格式' })
    }

    // ===== 重复上传处理 =====
    const [existingRows] = await pool.query('SELECT song_id, user_id, title, status FROM music WHERE file_md5 = ?', [md5])
    if (existingRows.length > 0) {
      const e = existingRows[0]
      if (e.status === 'approved') {
        return sendJson(res, 200, {
          ok: false,
          code: 'DUPLICATE_APPROVED',
          message: '该歌曲库中已存在（已审核通过），无需重复上传',
          song: { song_id: e.song_id, title: e.title },
        })
      }
      if (e.status === 'pending') {
        return sendJson(res, 200, {
          ok: false,
          code: 'DUPLICATE_PENDING',
          message: '该文件已有用户上传，正在审核中，请勿重复上传',
        })
      }
      // rejected：允许重新上传（复用记录，替换为新上传者）
      ensureDir()
      const songId = e.song_id
      fs.writeFileSync(path.join(UPLOAD_DIR, `${songId}.${ext}`), filePart.data)
      await pool.query(
        `UPDATE music SET user_id=?, title=?, artist=?, ext=?, filename=?, size=?, status='pending' WHERE song_id=?`,
        [userId, title, artist, ext, filePart.filename || '', filePart.data.length, songId],
      )
      return sendJson(res, 200, { ok: true, songId, status: 'pending', message: '上传成功，等待审核（仅你本人可听）' })
    }

    // ===== 全新上传 =====
    ensureDir()
    const songId = genId()
    fs.writeFileSync(path.join(UPLOAD_DIR, `${songId}.${ext}`), filePart.data)
    await pool.query(
      `INSERT INTO music (song_id, user_id, title, artist, ext, filename, file_md5, size, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [songId, userId, title, artist, ext, filePart.filename || '', md5, filePart.data.length],
    )
    return sendJson(res, 200, { ok: true, songId, status: 'pending', message: '上传成功，等待审核（仅你本人可听）' })
  }

  // ============ root 审核 ============
  if (pathname === '/api/admin/music' && req.method === 'GET') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [[me]] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [userId])
    if (!isAdminRow(me)) return sendJson(res, 403, { ok: false, message: '仅 root 可审核' })
    const [rows] = await pool.query(
      `SELECT song_id, user_id, title, artist, ext, filename, size, status, created_at
       FROM music WHERE status='pending' ORDER BY created_at ASC`,
    )
    return sendJson(res, 200, { ok: true, songs: rows })
  }

  if (pathname === '/api/admin/music/approve' && req.method === 'POST') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [[me]] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [userId])
    if (!isAdminRow(me)) return sendJson(res, 403, { ok: false, message: '仅 root 可审核' })

    const body = await readBody(req)
    const songId = String(body.songId || '')
    const action = body.action === 'reject' ? 'rejected' : 'approved'

    const [[song]] = await pool.query('SELECT * FROM music WHERE song_id = ?', [songId])
    if (!song) return sendJson(res, 404, { ok: false, message: '歌曲不存在' })
    if (song.status !== 'pending') {
      return sendJson(res, 200, { ok: false, message: '该歌曲已被处理过，请刷新列表' })
    }

    // ===== 审核去重：批准时若库中已有同 MD5 的已通过版本 → 拒绝本次 =====
    if (action === 'approved') {
      const [dupRows] = await pool.query(
        `SELECT song_id, title FROM music WHERE file_md5=? AND status='approved' AND song_id<>?`,
        [song.file_md5, songId],
      )
      if (dupRows.length > 0) {
        await pool.query(`UPDATE music SET status='rejected' WHERE song_id=?`, [songId])
        return sendJson(res, 200, {
          ok: false,
          code: 'DUP_REVIEW',
          message: `库中已有审核通过的相同文件《${dupRows[0].title}》，本条已自动标记拒绝，避免重复`,
        })
      }
    }

    await pool.query('UPDATE music SET status=? WHERE song_id=?', [action, songId])
    return sendJson(res, 200, { ok: true, message: action === 'approved' ? '已通过，全体用户可听' : '已拒绝' })
  }

  // ============ 流式播放（Range，支持 seek） ============
  if (pathname.startsWith('/api/music/stream/') && req.method === 'GET') {
    const songId = pathname.slice('/api/music/stream/'.length).split('/')[0]
    const qToken = url.searchParams.get('token') || ''
    const uid = getUserByToken(qToken) || userId
    if (!uid) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })

    const [[song]] = await pool.query('SELECT * FROM music WHERE song_id = ?', [songId])
    if (!song) return sendJson(res, 404, { ok: false, message: '歌曲不存在' })
    const [[me]] = await pool.query('SELECT role FROM rxy_web WHERE user_id = ?', [uid])
    if (!canListen(song, uid, isAdminRow(me))) {
      return sendJson(res, 403, { ok: false, message: '该歌曲审核通过前仅上传者可听' })
    }

    const filePath = path.join(UPLOAD_DIR, `${songId}.${song.ext}`)
    if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, message: '文件缺失' })

    const stat = fs.statSync(filePath)
    const mime = `audio/${song.ext === 'mp3' ? 'mpeg' : song.ext}`
    const range = req.headers.range
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range)
      if (!m) return sendJson(res, 416, { ok: false })
      const start = parseInt(m[1], 10)
      let end = m[2] ? parseInt(m[2], 10) : stat.size - 1
      if (start >= stat.size) return sendJson(res, 416, { ok: false })
      end = Math.min(end, stat.size - 1)
      res.writeHead(206, {
        'Content-Type': mime,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      })
      fs.createReadStream(filePath, { start, end }).pipe(res)
      return undefined
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    })
    fs.createReadStream(filePath).pipe(res)
    return undefined
  }

  // ============ 歌单 ============
  if (pathname === '/api/playlists' && req.method === 'GET') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [pls] = await pool.query(
      `SELECT p.playlist_id, p.name, p.share_code, p.created_at, COUNT(ps.song_id) AS song_count
       FROM playlists p LEFT JOIN playlist_songs ps ON p.playlist_id = ps.playlist_id
       WHERE p.user_id=? GROUP BY p.playlist_id, p.name, p.share_code, p.created_at ORDER BY p.created_at DESC`,
      [userId],
    )
    // 附带每首歌单的歌曲明细（含权限过滤）
    const result = []
    for (const pl of pls) {
      const [songs] = await pool.query(
        `SELECT m.song_id, m.user_id, m.title, m.artist, m.ext, m.size, m.status
         FROM playlist_songs ps JOIN music m ON ps.song_id = m.song_id
         WHERE ps.playlist_id=? ORDER BY ps.added_at DESC`,
        [pl.playlist_id],
      )
      result.push({
        playlist_id: pl.playlist_id,
        name: pl.name,
        share_code: pl.share_code || null,
        created_at: pl.created_at,
        song_count: pl.song_count,
        songs: songs.filter((s) => canListen(s, userId, false)),
      })
    }
    return sendJson(res, 200, { ok: true, playlists: result })
  }

  if (pathname === '/api/playlists' && req.method === 'POST') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const body = await readBody(req)
    const name = String(body.name || '').trim().slice(0, 50)
    if (!name) return sendJson(res, 400, { ok: false, message: '歌单名不能为空' })
    const playlistId = genId()
    const shareCode = genShareCode()
    await pool.query('INSERT INTO playlists (playlist_id, user_id, name, share_code) VALUES (?, ?, ?, ?)', [playlistId, userId, name, shareCode])
    return sendJson(res, 200, { ok: true, playlist_id: playlistId, share_code: shareCode, message: '歌单已创建' })
  }

  // 歌单分享码：获取/生成
  const plShare = /^\/api\/playlists\/([^/]+)\/share$/.exec(pathname)
  if (plShare && req.method === 'POST') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [[pl]] = await pool.query('SELECT user_id, share_code FROM playlists WHERE playlist_id = ?', [plShare[1]])
    if (!pl || pl.user_id !== userId) return sendJson(res, 403, { ok: false, message: '无权操作该歌单' })
    const code = pl.share_code || genShareCode()
    if (!pl.share_code) await pool.query('UPDATE playlists SET share_code = ? WHERE playlist_id = ?', [code, plShare[1]])
    return sendJson(res, 200, { ok: true, share_code: code })
  }

  // 通过分享码查看歌单（只读）
  if (pathname === '/api/playlists/shared' && req.method === 'GET') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const code = String(url.searchParams.get('code') || '').trim().toUpperCase()
    if (!code) return sendJson(res, 400, { ok: false, message: '请输入歌单代码' })
    const [rows] = await pool.query(
      `SELECT p.playlist_id, p.name, p.user_id, p.created_at, w.role
       FROM playlists p LEFT JOIN rxy_web w ON w.user_id = p.user_id
       WHERE p.share_code = ?`,
      [code],
    )
    if (!rows.length) return sendJson(res, 404, { ok: false, message: '歌单代码不存在' })
    const pl = rows[0]
    const [songs] = await pool.query(
      `SELECT m.song_id, m.title, m.artist, m.ext, m.size, m.status
       FROM playlist_songs ps JOIN music m ON ps.song_id = m.song_id
       WHERE ps.playlist_id=? ORDER BY ps.added_at DESC`,
      [pl.playlist_id],
    )
    return sendJson(res, 200, {
      ok: true,
      playlist: {
        playlist_id: pl.playlist_id,
        name: pl.name,
        owner: pl.user_id,
        owner_role: pl.role || 'user',
        created_at: pl.created_at,
        songs: songs.filter((s) => canListen(s, userId, false)),
      },
    })
  }

  // 歌单增删歌曲 / 删除歌单
  const plMatch = /^\/api\/playlists\/([^/]+)\/songs$/.exec(pathname)
  if (plMatch && req.method === 'POST') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const body = await readBody(req)
    const [[pl]] = await pool.query('SELECT user_id FROM playlists WHERE playlist_id = ?', [plMatch[1]])
    if (!pl || pl.user_id !== userId) return sendJson(res, 403, { ok: false, message: '无权操作该歌单' })
    const [[song]] = await pool.query('SELECT status, user_id FROM music WHERE song_id = ?', [String(body.songId || '')])
    if (!song || !canListen(song, userId, false)) {
      return sendJson(res, 403, { ok: false, message: '该歌曲暂不可添加' })
    }
    await pool.query(
      'INSERT IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)',
      [plMatch[1], String(body.songId || '')],
    )
    return sendJson(res, 200, { ok: true })
  }

  if (plMatch && req.method === 'DELETE') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const body = await readBody(req)
    const [[pl]] = await pool.query('SELECT user_id FROM playlists WHERE playlist_id = ?', [plMatch[1]])
    if (!pl || pl.user_id !== userId) return sendJson(res, 403, { ok: false, message: '无权操作该歌单' })
    await pool.query('DELETE FROM playlist_songs WHERE playlist_id=? AND song_id=?', [plMatch[1], String(body.songId || '')])
    return sendJson(res, 200, { ok: true })
  }

  const plDel = /^\/api\/playlists\/([^/]+)$/.exec(pathname)
  if (plDel && req.method === 'DELETE') {
    if (!userId) return sendJson(res, 401, { ok: false, message: '登录已过期，请重新登录' })
    const [[pl]] = await pool.query('SELECT user_id FROM playlists WHERE playlist_id = ?', [plDel[1]])
    if (!pl || pl.user_id !== userId) return sendJson(res, 403, { ok: false, message: '无权操作该歌单' })
    await pool.query('DELETE FROM playlist_songs WHERE playlist_id=?', [plDel[1]])
    await pool.query('DELETE FROM playlists WHERE playlist_id=?', [plDel[1]])
    return sendJson(res, 200, { ok: true })
  }

  return undefined // 未匹配 → 交给上层 404
}
