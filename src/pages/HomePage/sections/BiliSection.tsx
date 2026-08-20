import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BiliPage { cid: number; page: number; part: string; duration: number }
interface BiliStream { id: number; bandwidth: number; height?: number; width?: number; baseUrl: string }

export default function BiliSection() {
  const [url, setUrl] = useState('');
  const [info, setInfo] = useState<{ bvid: string; title: string; cover: string; author: string; duration: number; views: number; likes: number; pubdate: number; desc: string; pages: BiliPage[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageIdx, setPageIdx] = useState(0);
  const [streams, setStreams] = useState<{ audio: BiliStream[]; video: BiliStream[] } | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);

  const parse = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setInfo(null);
    setStreams(null);
    setMediaUrl('');
    try {
      const res = await fetch(`/api/bili/info?url=${encodeURIComponent(url.trim())}`).then((r) => r.json());
      if (!res.ok) {
        setError(res.message || '解析失败');
        return;
      }
      setInfo(res);
      setPageIdx(0);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const loadStreams = async (bvid: string, cid: number) => {
    setMediaLoading(true);
    setError('');
    setMediaUrl('');
    try {
      const res = await fetch(`/api/bili/playurl?bvid=${bvid}&cid=${cid}`).then((r) => r.json());
      if (!res.ok) {
        setError(res.message || '获取播放地址失败');
        return;
      }
      setStreams(res.streams);
    } catch {
      setError('网络错误');
    } finally {
      setMediaLoading(false);
    }
  };

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const fmtNum = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n));
  const streamUrl = (u: string) => `/api/bili/stream?u=${encodeURIComponent(u)}`;

  return (
    <div className="report-card p-6">
      <div className="section-label mb-1">Bilibili Parser · B 站视频解析</div>
      <div className="section-subtitle mb-4">输入 BV 号或视频链接，获取视频信息与音视频流，支持三种方式下载</div>
      <div className="flex gap-2 mb-5 max-w-2xl">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void parse()}
          placeholder="https://www.bilibili.com/video/BV... 或直接 BV 号"
          className="h-10 flex-1 rounded-none bp-no-elevate"
        />
        <Button onClick={() => void parse()} disabled={loading} className="bg-[#fb7299] hover:bg-[#e35d83] rounded-none h-10 px-5">
          {loading ? '解析中...' : '解析'}
        </Button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-[11px] font-bold">⚠️ {error}</div>}

      {info && (
        <div className="space-y-5">
          <div className="flex gap-4">
            <img src={info.cover} alt="封面" className="w-40 h-24 object-cover border thin-border shrink-0" />
            <div className="min-w-0">
              <div className="text-[14px] font-black text-slate-800 leading-snug">{info.title}</div>
              <div className="text-[11px] text-slate-500 mt-1">UP主：{info.author} · 时长 {fmtDur(info.duration)} · 播放 {fmtNum(info.views)} · 点赞 {fmtNum(info.likes)}</div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{info.desc || '（无简介）'}</div>
            </div>
          </div>

          {info.pages.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {info.pages.map((p, i) => (
                <button
                  key={p.cid}
                  onClick={() => {
                    setPageIdx(i);
                    setStreams(null);
                    setMediaUrl('');
                  }}
                  className={`px-3 py-1.5 text-[10px] font-bold border transition-colors bp-no-elevate ${pageIdx === i ? 'bg-[#0033a0] text-white border-[#0033a0]' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  P{i + 1} {p.part.slice(0, 12)}
                </button>
              ))}
            </div>
          )}

          <Button onClick={() => void loadStreams(info.bvid, info.pages[pageIdx].cid)} disabled={mediaLoading} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">
            {mediaLoading ? '获取中...' : '📥 获取音视频流'}
          </Button>

          {streams && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="table-header mb-2">🎵 音频流（可播放/下载）</div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {streams.audio.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMediaUrl(streamUrl(a.baseUrl));
                        setIsVideo(false);
                      }}
                      className={`w-full flex items-center gap-2 p-2 text-left border thin-border transition-colors bp-no-elevate ${mediaUrl === streamUrl(a.baseUrl) ? 'bg-[#fb7299]/10 border-[#fb7299]' : 'bg-slate-50 hover:bg-slate-100'}`}
                    >
                      <span className="text-[11px] font-bold text-slate-600">音质 {a.id}</span>
                      <span className="text-[9px] text-slate-400 ml-auto">{(a.bandwidth / 1000).toFixed(0)}kbps</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="table-header mb-2">🎬 视频流（清晰度，可能需要登录）</div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {streams.video.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMediaUrl(streamUrl(v.baseUrl));
                        setIsVideo(true);
                      }}
                      className={`w-full flex items-center gap-2 p-2 text-left border thin-border transition-colors bp-no-elevate ${mediaUrl === streamUrl(v.baseUrl) ? 'bg-[#fb7299]/10 border-[#fb7299]' : 'bg-slate-50 hover:bg-slate-100'}`}
                    >
                      <span className="text-[11px] font-bold text-slate-600">{v.height}p</span>
                      <span className="text-[9px] text-slate-400 ml-auto">{(v.bandwidth / 1000).toFixed(0)}kbps</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mediaUrl && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">下载</span>
                {!isVideo && (
                  <a
                    href={`/api/bili/merge?bvid=${info.bvid}&cid=${info.pages[pageIdx].cid}`}
                    className="px-3 py-1.5 bg-[#00a05a] hover:bg-[#00854b] text-white text-[10px] font-black uppercase tracking-wider"
                  >
                    ⬇ 下载合并版（视频+音频）
                  </a>
                )}
                <a
                  href={isVideo ? mediaUrl : `${mediaUrl}&dl=1`}
                  className="px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider"
                  download
                >
                  ⬇ 下载{isVideo ? '视频（无声）' : '音频'}
                </a>
              </div>
              <div className="text-[9px] text-slate-400">提示：先选下方任意一条流再下载；合并版自动合成最高清视频+音频（服务器临时处理，不保留文件）</div>
              {isVideo ? (
                <video src={mediaUrl} controls className="w-full max-h-96 bg-black" />
              ) : (
                <audio src={mediaUrl} controls className="w-full" />
              )}
            </div>
          )}
          <div className="text-[9px] text-slate-300">仅供个人学习使用，请尊重 UP 主版权</div>
        </div>
      )}
    </div>
  );
}
