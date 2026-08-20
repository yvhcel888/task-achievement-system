// 多平台音乐搜索：网易云 / QQ音乐 / B站（搜索+播放地址+下载代理）
// 播放/下载统一走 /api/msearch/stream?u= 服务器代理（防盗链）
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const fmtDur = (sec) => {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export async function handleMSearchApi(req, res, { sendJson }) {
  const url = new URL(req.url, 'http://localhost')
  const pathname = url.pathname

  // ============ 搜索 ============
  if (pathname === '/api/msearch' && req.method === 'GET') {
    const q = String(url.searchParams.get('q') || '').trim()
    const platform = String(url.searchParams.get('platform') || 'netease')
    if (!q) return sendJson(res, 400, { ok: false, message: '请输入搜索关键词' })
    try {
      if (platform === 'netease') {
        const r = await fetch(
          `https://music.163.com/api/search/get/web?s=${encodeURIComponent(q)}&type=1&limit=15&offset=0`,
          { headers: { 'User-Agent': UA, Referer: 'https://music.163.com/' } },
        )
        const d = await r.json()
        const songs = (d?.result?.songs || []).map((s) => ({
          platform: 'netease',
          id: String(s.id),
          title: s.name,
          artist: (s.artists || []).map((a) => a.name).join('/'),
          album: s.album?.name || '',
          duration: fmtDur(s.duration / 1000),
          durationSec: Math.floor((s.duration || 0) / 1000),
        }))
        return sendJson(res, 200, { ok: true, platform, songs })
      }
      if (platform === 'qq') {
        const r = await fetch(
          `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=${encodeURIComponent(q)}&format=json&p=1&n=15&cr=1&g_tk=5381`,
          { headers: { 'User-Agent': UA, Referer: 'https://y.qq.com/' } },
        )
        const text = await r.text()
        const trimmed = text.trim()
        // 纯 JSON 直接用；jsonp 包装才剥壳
        const json = JSON.parse(trimmed.startsWith('{') ? trimmed : trimmed.replace(/^[^(]*\(|\)[^)]*$/g, ''))
        const songs = (json?.data?.song?.list || []).map((s) => ({
          platform: 'qq',
          id: s.songmid,
          title: s.songname,
          artist: (s.singer || []).map((a) => a.name).join('/'),
          album: s.albumname || '',
          duration: fmtDur(s.interval),
          durationSec: s.interval || 0,
        }))
        return sendJson(res, 200, { ok: true, platform, songs })
      }
      if (platform === 'bili') {
        const r = await fetch(
          `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(q)}&page=1`,
          { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } },
        )
        const d = await r.json()
        const songs = (d?.data?.result || []).slice(0, 15).map((v) => ({
          platform: 'bili',
          id: v.bvid,
          title: v.title.replace(/<[^>]+>/g, ''),
          artist: v.author,
          album: 'B站视频',
          duration: fmtDur(v.duration),
          durationSec: v.duration || 0,
        }))
        return sendJson(res, 200, { ok: true, platform, songs })
      }
      return sendJson(res, 400, { ok: false, message: '不支持的平台' })
    } catch (e) {
      return sendJson(res, 502, { ok: false, message: '搜索服务暂不可用，请稍后重试' })
    }
  }

  // ============ 获取播放地址（网易云/QQ 需要额外请求） ============
  if (pathname === '/api/msearch/url' && req.method === 'GET') {
    const platform = String(url.searchParams.get('platform') || '')
    const id = String(url.searchParams.get('id') || '')
    if (!platform || !id) return sendJson(res, 400, { ok: false, message: '缺少参数' })
    try {
      if (platform === 'netease') {
        for (const br of [320000, 128000]) {
          const r = await fetch(
            `https://music.163.com/api/song/enhance/player/url?id=${id}&ids=%5B${id}%5D&br=${br}`,
            { headers: { 'User-Agent': UA, Referer: 'https://music.163.com/' } },
          )
          const d = await r.json()
          const u = (d?.data || [])[0]?.url
          if (u) return sendJson(res, 200, { ok: true, url: u, br: br / 1000, platform })
        }
        return sendJson(res, 200, { ok: false, message: '该歌曲无可用播放地址（可能需 VIP 或无版权）' })
      }
      if (platform === 'qq') {
        const guid = Math.floor(Math.random() * 1e10)
        const body = {
          req_0: {
            module: 'vkey.GetVkeyServer',
            method: 'CgiGetVkey',
            param: { guid, songmid: [id], songtype: [0], uin: '0', loginflag: 1, platform: '20' },
          },
        }
        const r = await fetch('https://u.y.qq.com/cgi-bin/musicu.fcgi?format=json&data=' + encodeURIComponent(JSON.stringify(body)), {
          headers: { 'User-Agent': UA, Referer: 'https://y.qq.com/' },
        })
        const d = await r.json()
        const urls = d?.req_0?.data?.midurlinfo || []
        const sip = d?.req_0?.data?.sip || []
        const u = urls[0]?.purl
        if (u && sip.length) return sendJson(res, 200, { ok: true, url: sip[0] + u, br: 128, platform })
        return sendJson(res, 200, { ok: false, message: '该平台暂不支持在线播放（版权/风控限制），试试 B 站搜索' })
      }
      if (platform === 'bili') {
        // bvid → cid → 音频流（B站可稳定匿名获取）
        const r = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${id}`, {
          headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
        })
        const d = await r.json()
        if (d.code !== 0) return sendJson(res, 200, { ok: false, message: '视频信息获取失败' })
        const cid = d.data.pages[0].cid
        const r2 = await fetch(
          `https://api.bilibili.com/x/player/playurl?bvid=${id}&cid=${cid}&fnval=16&fnver=0&qn=127&fourk=1`,
          { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } },
        )
        const p = await r2.json()
        if (p.code !== 0) return sendJson(res, 200, { ok: false, message: '播放流获取失败' })
        const audios = p.data?.dash?.audio || []
        if (!audios.length) return sendJson(res, 200, { ok: false, message: '无可用音频流' })
        const best = [...audios].sort((a, b) => b.bandwidth - a.bandwidth)[0]
        const u = best.baseUrl || best.backupUrl?.[0]
        if (!u) return sendJson(res, 200, { ok: false, message: '音频地址为空' })
        return sendJson(res, 200, { ok: true, url: u, br: Math.round(best.bandwidth / 1000), platform })
      }
      return sendJson(res, 400, { ok: false, message: '不支持的平台' })
    } catch (e) {
      return sendJson(res, 502, { ok: false, message: '获取播放地址失败' })
    }
  }

  // ============ 播放/下载代理（防盗链转发） ============
  if (pathname === '/api/msearch/stream' && req.method === 'GET') {
    const target = url.searchParams.get('u')
    if (!target || !/^https?:\/\//.test(target)) return sendJson(res, 400, { ok: false, message: '无效地址' })
    try {
      const headers = { 'User-Agent': UA }
      if (req.headers.range) headers.Range = req.headers.range
      const upstream = await fetch(target, { headers, redirect: 'follow' })
      if (!upstream.ok && upstream.status !== 206) {
        res.statusCode = upstream.status
        res.end('upstream error')
        return undefined
      }
      res.statusCode = upstream.status
      const ct = upstream.headers.get('content-type') || 'audio/mpeg'
      const cl = upstream.headers.get('content-length')
      const cr = upstream.headers.get('content-range')
      res.setHeader('Content-Type', ct)
      res.setHeader('Accept-Ranges', 'bytes')
      if (cl) res.setHeader('Content-Length', cl)
      if (cr) res.setHeader('Content-Range', cr)
      if (url.searchParams.get('dl') === '1') {
        res.setHeader('Content-Disposition', 'attachment; filename="music-download.mp3"')
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

  return sendJson(res, 404, { ok: false, message: '接口不存在' })
}
