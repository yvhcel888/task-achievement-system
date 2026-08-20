// B 站视频解析器：通过公开 API 获取视频信息与音视频流（替代已失效的 HTML 爬虫）
// 仅作个人学习用途
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function extractBvid(input) {
  const m = /BV[0-9A-Za-z]{10}/.exec(String(input || ''))
  return m ? m[0] : null
}

export async function handleBiliApi(req, res, { sendJson }) {
  const url = new URL(req.url, 'http://localhost')
  const pathname = url.pathname

  // ============ 视频信息 ============
  if (pathname === '/api/bili/info' && req.method === 'GET') {
    const bvid = extractBvid(url.searchParams.get('url'))
    if (!bvid) return sendJson(res, 400, { ok: false, message: '请输入有效的 BV 号或 B 站视频链接' })
    try {
      const r = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
        headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
      })
      const data = await r.json()
      if (data.code !== 0) return sendJson(res, 404, { ok: false, message: `获取失败：${data.message || '视频不存在或已失效'}` })
      const d = data.data
      return sendJson(res, 200, {
        ok: true,
        bvid,
        title: d.title,
        cover: d.pic,
        author: d.owner?.name,
        authorFace: d.owner?.face,
        duration: d.duration,
        views: d.stat?.view,
        likes: d.stat?.like,
        danmaku: d.stat?.danmaku,
        pubdate: d.pubdate,
        desc: (d.desc || '').slice(0, 300),
        pages: (d.pages || []).map((p) => ({ cid: p.cid, page: p.page, part: p.part, duration: p.duration })),
      })
    } catch (e) {
      return sendJson(res, 502, { ok: false, message: '无法连接 B 站服务，请稍后重试' })
    }
  }

  // ============ 播放流地址 ============
  if (pathname === '/api/bili/playurl' && req.method === 'GET') {
    const bvid = extractBvid(url.searchParams.get('bvid'))
    const cid = Number(url.searchParams.get('cid')) || 0
    if (!bvid || !cid) return sendJson(res, 400, { ok: false, message: '缺少参数' })
    try {
      const r = await fetch(
        `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=16&fnver=0&qn=127&fourk=1`,
        { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } },
      )
      const data = await r.json()
      if (data.code !== 0) return sendJson(res, 404, { ok: false, message: `获取失败：${data.message || '需要登录或该视频不可播放'}` })
      const dash = data.data?.dash
      const streams = {
        audio: (dash?.audio || []).map((a) => ({ id: a.id, bandwidth: a.bandwidth, codecs: a.codecs, baseUrl: a.baseUrl, backupUrl: a.backupUrl?.[0] })),
        video: (dash?.video || []).map((v) => ({ id: v.id, width: v.width, height: v.height, bandwidth: v.bandwidth, codecs: v.codecs, baseUrl: v.baseUrl, backupUrl: v.backupUrl?.[0] })),
      }
      // 按清晰度排序（高→低），音频按音质（高→低）
      streams.video.sort((a, b) => b.height - a.height)
      streams.audio.sort((a, b) => b.bandwidth - a.bandwidth)
      return sendJson(res, 200, { ok: true, streams })
    } catch (e) {
      return sendJson(res, 502, { ok: false, message: '无法连接 B 站服务，请稍后重试' })
    }
  }

  // ============ 流代理转发（带 UA/Referer + Range） ============
  if (pathname === '/api/bili/stream' && req.method === 'GET') {
    const target = url.searchParams.get('u')
    if (!target || !/^https?:\/\//.test(target)) return sendJson(res, 400, { ok: false, message: '无效的流地址' })
    try {
      const headers = { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' }
      if (req.headers.range) headers.Range = req.headers.range
      const upstream = await fetch(target, { headers })
      if (!upstream.ok && upstream.status !== 206) {
        res.statusCode = upstream.status
        res.end('upstream error')
        return undefined
      }
      res.statusCode = upstream.status
      const ct = upstream.headers.get('content-type') || 'application/octet-stream'
      const cl = upstream.headers.get('content-length')
      const cr = upstream.headers.get('content-range')
      res.setHeader('Content-Type', ct)
      res.setHeader('Accept-Ranges', 'bytes')
      if (cl) res.setHeader('Content-Length', cl)
      if (cr) res.setHeader('Content-Range', cr)
      // 下载模式附加文件名
      if (url.searchParams.get('dl') === '1') {
        const ext = ct.includes('video') ? 'mp4' : 'mp3'
        res.setHeader('Content-Disposition', `attachment; filename="bilibili-download.${ext}"`)
      }
      const reader = upstream.body?.getReader()
      if (!reader) {
        res.end()
        return undefined
      }
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
      res.end()
      return undefined
    } catch (e) {
      res.statusCode = 502
      res.end('proxy error')
      return undefined
    }
  }

  // ============ 合并下载（视频+音频 → ffmpeg → mp4，不落库不保留） ============
  if (pathname === '/api/bili/merge' && req.method === 'GET') {
    const bvid = extractBvid(url.searchParams.get('bvid'))
    const cid = Number(url.searchParams.get('cid')) || 0
    if (!bvid || !cid) return sendJson(res, 400, { ok: false, message: '缺少参数' })
    const { execFile } = await import('node:child_process')
    const os = await import('node:os')
    const fs = await import('node:fs')
    const path = await import('node:path')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-merge-'))
    const vFile = path.join(tmpDir, 'v.m4s')
    const aFile = path.join(tmpDir, 'a.m4s')
    const outFile = path.join(tmpDir, 'out.mp4')
    const UA_HDRS = { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' }
    try {
      // 1. 取播放流
      const playRes = await fetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=16&fnver=0&qn=127&fourk=1`, { headers: UA_HDRS })
      const playData = await playRes.json()
      if (playData.code !== 0) return sendJson(res, 404, { ok: false, message: `获取播放流失败：${playData.message || '未知错误'}` })
      const dash = playData.data?.dash
      if (!dash?.audio?.length) return sendJson(res, 404, { ok: false, message: '该视频没有可用音频流' })
      const vStream = dash.video?.length ? [...dash.video].sort((a, b) => b.height - a.height)[0] : null
      const aStream = [...dash.audio].sort((a, b) => b.bandwidth - a.bandwidth)[0]
      if (!vStream) return sendJson(res, 404, { ok: false, message: '该视频没有可用视频流（可能需要登录）' })
      // 2. 下载音视频到临时文件
      const download = async (u, dest) => {
        const r = await fetch(u, { headers: UA_HDRS })
        if (!r.ok) throw new Error(`下载失败 HTTP ${r.status}`)
        const buf = Buffer.from(await r.arrayBuffer())
        fs.writeFileSync(dest, buf)
      }
      await Promise.all([download(vStream.baseUrl, vFile), download(aStream.baseUrl, aFile)])
      // 3. ffmpeg 合并（流复制，不转码）
      await new Promise((resolve, reject) => {
        execFile(
          'ffmpeg',
          ['-y', '-i', vFile, '-i', aFile, '-c', 'copy', '-movflags', '+faststart', outFile],
          { timeout: 300000 },
          (err) => (err ? reject(err) : resolve()),
        )
      })
      // 4. 流式返回
      const stat = fs.statSync(outFile)
      res.statusCode = 200
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Content-Length', stat.size)
      res.setHeader('Content-Disposition', `attachment; filename="bilibili-${bvid}-${cid}.mp4"`)
      fs.createReadStream(outFile).pipe(res)
      res.on('finish', () => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      })
      return undefined
    } catch (e) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
      return sendJson(res, 502, { ok: false, message: `合并失败：${e.message || '服务器错误'}` })
    }
  }

  return sendJson(res, 404, { ok: false, message: '接口不存在' })
}
