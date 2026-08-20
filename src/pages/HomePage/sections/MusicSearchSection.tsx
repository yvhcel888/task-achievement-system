import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Play, Download, Loader2, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SubTabBar from '@/components/SubTabBar';

type MPlatform = 'netease' | 'qq' | 'bili';

const PLATFORMS: { id: MPlatform; label: string; emoji: string }[] = [
  { id: 'netease', label: '网易云', emoji: '🎵' },
  { id: 'qq', label: 'QQ音乐', emoji: '🎧' },
  { id: 'bili', label: 'B站', emoji: '📺' },
];

interface MSong {
  platform: MPlatform;
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec?: number;
}

export default function MusicSearchSection() {
  const [platform, setPlatform] = useState<MPlatform>('netease');
  const [q, setQ] = useState('');
  const [songs, setSongs] = useState<MSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [playingUrl, setPlayingUrl] = useState('');
  const [playingTitle, setPlayingTitle] = useState('');
  const [fetchingId, setFetchingId] = useState('');

  const search = async (target?: string, plat?: MPlatform) => {
    const keyword = (target ?? q).trim();
    const p = plat ?? platform;
    if (!keyword) {
      toast.error('请输入搜索关键词');
      return;
    }
    setLoading(true);
    setError('');
    setSongs([]);
    setSearched(true);
    setPlayingUrl('');
    try {
      const res = await fetch(`/api/msearch?q=${encodeURIComponent(keyword)}&platform=${p}`).then((r) => r.json());
      if (!res.ok) {
        setError(res.message || '搜索失败');
        return;
      }
      setSongs(res.songs || []);
      if (!res.songs?.length) setError('没有找到相关歌曲，换个关键词试试');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const play = async (song: MSong) => {
    if (song.platform !== 'bili') {
      toast.info('该平台暂不支持在线播放（版权/风控限制），试试 B 站搜索');
      return;
    }
    setFetchingId(song.id);
    try {
      const res = await fetch(`/api/msearch/url?platform=bili&id=${song.id}`).then((r) => r.json());
      if (!res.ok || !res.url) {
        toast.error(res.message || '获取播放地址失败');
        return;
      }
      setPlayingUrl(`/api/msearch/stream?u=${encodeURIComponent(res.url)}`);
      setPlayingTitle(`${song.title} - ${song.artist}`);
    } catch {
      toast.error('网络错误');
    } finally {
      setFetchingId('');
    }
  };

  const download = async (song: MSong) => {
    if (song.platform !== 'bili') {
      toast.info('该平台暂不支持下载（版权/风控限制），试试 B 站搜索');
      return;
    }
    try {
      const res = await fetch(`/api/msearch/url?platform=bili&id=${song.id}`).then((r) => r.json());
      if (!res.ok || !res.url) {
        toast.error(res.message || '获取下载地址失败');
        return;
      }
      window.open(`/api/msearch/stream?u=${encodeURIComponent(res.url)}&dl=1`, '_blank');
    } catch {
      toast.error('网络错误');
    }
  };

  const switchPlatform = (p: MPlatform) => {
    setPlatform(p);
    if (searched && q.trim()) void search(q, p);
  };

  return (
    <div className="space-y-5">
      <div className="report-card p-3">
        <SubTabBar
          tabs={PLATFORMS}
          active={platform}
          onChange={(id) => switchPlatform(id as MPlatform)}
        />
      </div>

      {/* 搜索框 */}
      <div className="report-card p-4">
        <div className="flex gap-2 max-w-2xl">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void search()}
            placeholder="搜索歌曲 / 歌手 / 视频..."
            className="h-10 flex-1 rounded-none bp-no-elevate"
          />
          <Button onClick={() => void search()} disabled={loading} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-10 px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            搜索
          </Button>
        </div>
        <div className="text-[10px] text-slate-400 mt-2">
          🔍 支持平台：{PLATFORMS.map((p) => p.label).join(' / ')} · B 站结果可在线播放与下载，网易云/QQ 受版权与风控限制仅展示
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-500 text-[11px] font-bold">⚠️ {error}</div>}

      {/* 播放器 */}
      {playingUrl && (
        <div className="report-card p-3 flex items-center gap-3">
          <Music2 className="w-4 h-4 text-[#0033a0] shrink-0" />
          <span className="text-[11px] font-bold text-slate-700 truncate flex-1">{playingTitle}</span>
          <audio src={playingUrl} controls className="h-8 flex-1 max-w-xs" />
        </div>
      )}

      {/* 结果列表 */}
      {searched && !loading && (
        <div className="report-card overflow-hidden">
          <div className="p-3 bg-slate-50 thin-border-b text-[10px] font-black uppercase tracking-wider text-slate-400">
            {PLATFORMS.find((p) => p.id === platform)?.emoji} 搜索结果 · {songs.length} 首
          </div>
          <div className="divide-y divide-slate-50">
            {songs.map((s, i) => (
              <motion.div
                key={`${s.platform}-${s.id}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="flex items-center gap-3 p-3 hover:bg-slate-50/60 transition-colors"
              >
                <span className="text-[10px] font-black text-slate-300 w-5 text-right tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold text-slate-800 truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {s.artist}{s.album ? ` · ${s.album}` : ''} · {s.duration}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {s.platform === 'bili' ? (
                    <>
                      <button
                        onClick={() => void play(s)}
                        disabled={fetchingId === s.id}
                        title="在线播放"
                        className="w-7 h-7 bg-[#0033a0] hover:bg-[#002580] text-white flex items-center justify-center disabled:opacity-40"
                      >
                        {fetchingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => void download(s)}
                        title="下载 MP3"
                        className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[9px] text-slate-300 font-bold px-2">仅展示</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
