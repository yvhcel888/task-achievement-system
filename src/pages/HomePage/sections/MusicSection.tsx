import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Music2, Play, Pause, Upload, ListMusic, Plus, Trash2, ShieldCheck,
  CheckCircle2, XCircle, Loader2, Headphones, Search, Shuffle, ChevronDown, Share2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer, type PlayableSong } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SongRow {
  song_id: string;
  user_id: string;
  title: string;
  artist: string;
  ext: string;
  filename: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface PlaylistRow {
  playlist_id: string;
  name: string;
  song_count: number;
  songs: SongRow[];
}

type Tab = 'all' | 'playlists' | 'upload' | 'admin';

export default function MusicSection() {
  const { token, userId } = useAuth();
  const { current, playing, playSong, toggle, stop } = useMusicPlayer();
  const [tab, setTab] = useState<Tab>('all');
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [mine, setMine] = useState<SongRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [sharedPlaylist, setSharedPlaylist] = useState<{ playlist_id: string; name: string; owner: string; owner_role: string; created_at: string; songs: SongRow[] } | null>(null);
  const [pending, setPending] = useState<SongRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedAll, setCollapsedAll] = useState(false);
  const [collapsedMine, setCollapsedMine] = useState(false);
  const [collapsedPls, setCollapsedPls] = useState<Record<string, boolean>>({});

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      const [sRes, plRes] = await Promise.all([
        fetch('/api/music', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch('/api/playlists', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      if (sRes.ok) setSongs(sRes.songs);
      if (plRes.ok) setPlaylists(plRes.playlists);
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadMine = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/music/mine', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) setMine(res.songs);
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadPending = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/music', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) {
        setPending(res.songs);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadAll();
    void loadMine();
    void loadPending();
  }, [token, loadAll, loadMine, loadPending]);

  // 搜索过滤（标题/歌手）
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
    );
  }, [songs, search]);

  const canDelete = (s: SongRow) => isAdmin || s.user_id === userId;

  const playSongRow = (s: SongRow) => {
    if (!token) return;
    playSong(
      { song_id: s.song_id, title: s.title, artist: s.artist, ext: s.ext, status: s.status, user_id: s.user_id },
      token,
    );
  };

  const playRandom = () => {
    if (filtered.length === 0) {
      toast.info('没有可播放的歌曲');
      return;
    }
    const s = filtered[Math.floor(Math.random() * filtered.length)];
    playSongRow(s);
    toast.success(`🎲 随机播放：${s.title}`, { description: s.artist });
  };

  const handleDelete = async (s: SongRow) => {
    if (!token) return;
    if (!window.confirm(`确定删除《${s.title}》？该操作不可恢复`)) return;
    const res = await fetch(`/api/music/${s.song_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (res.ok) {
      toast.success(res.message || '已删除');
      if (current?.song_id === s.song_id) stop();
      void loadAll();
      void loadMine();
      void loadPending();
    } else {
      toast.error(res.message || '删除失败');
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const titleInput = form.querySelector<HTMLInputElement>('input[name="title"]');
    const artistInput = form.querySelector<HTMLInputElement>('input[name="artist"]');
    const file = fileInput?.files?.[0];
    if (!file) {
      toast.error('请选择音频文件');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', titleInput?.value || file.name.replace(/\.[^.]+$/, ''));
    fd.append('artist', artistInput?.value || '未知歌手');

    setUploading(true);
    try {
      const res = await fetch('/api/music/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      }).then((r) => r.json());
      if (res.ok) {
        toast.success('上传成功', { description: '等待 root 审核，审核前仅你本人可听' });
      } else if (res.code === 'DUPLICATE_APPROVED') {
        toast.info('库中已有相同歌曲', { description: `《${res.song?.title}》已审核通过，直接播放即可` });
      } else if (res.code === 'DUPLICATE_PENDING') {
        toast.info('重复上传', { description: res.message });
      } else {
        toast.error('上传失败', { description: res.message });
      }
      form.reset();
      void loadMine();
      void loadAll();
      void loadPending();
    } catch {
      toast.error('上传失败', { description: '网络错误，请重试' });
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (songId: string, action: 'approve' | 'reject') => {
    if (!token) return;
    const res = await fetch('/api/admin/music/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ songId, action }),
    }).then((r) => r.json());
    if (res.ok) {
      toast.success(res.message);
    } else if (res.code === 'DUP_REVIEW') {
      toast.warning('重复审核拦截', { description: res.message });
    } else {
      toast.error(res.message || '操作失败');
    }
    void loadPending();
    void loadAll();
  };

  const createPlaylist = async () => {
    if (!token) return;
    const name = window.prompt('新歌单名称：');
    if (!name?.trim()) return;
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim() }),
    }).then((r) => r.json());
    if (res.ok) {
      toast.success('歌单已创建');
      void loadAll();
    } else {
      toast.error(res.message || '创建失败');
    }
  };

  const addToPlaylist = async (playlistId: string, songId: string) => {
    if (!token) return;
    await fetch(`/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ songId }),
    });
    void loadAll();
    toast.success('已加入歌单');
  };

  const removeFromPlaylist = async (playlistId: string, songId: string) => {
    if (!token) return;
    await fetch(`/api/playlists/${playlistId}/songs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ songId }),
    });
    void loadAll();
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!token) return;
    if (!window.confirm('确定删除该歌单？')) return;
    await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast.success('歌单已删除');
    void loadAll();
  };

  const sharePlaylist = async (playlistId: string) => {
    if (!token) return;
    const res = await fetch(`/api/playlists/${playlistId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (!res.ok) {
      toast.error(res.message || '获取分享码失败');
      return;
    }
    navigator.clipboard?.writeText(res.share_code).catch(() => undefined);
    toast.success(`分享码已复制：${res.share_code}`);
  };

  const viewShared = async () => {
    if (!token) return;
    const code = shareCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error('请输入歌单代码');
      return;
    }
    const res = await fetch(`/api/playlists/shared?code=${encodeURIComponent(code)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (!res.ok) {
      setSharedPlaylist(null);
      toast.error(res.message || '歌单不存在');
      return;
    }
    setSharedPlaylist(res.playlist);
  };

  const isCurrent = (id: string) => current?.song_id === id;

  return (
    <div className="space-y-5">
      {/* 顶部 Tab + 搜索 + 随机 */}
      <div className="report-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton active={tab === 'all'} onClick={() => setTab('all')} icon={<Headphones className="w-3.5 h-3.5" />} label="全部歌曲" />
          <TabButton active={tab === 'playlists'} onClick={() => setTab('playlists')} icon={<ListMusic className="w-3.5 h-3.5" />} label="我的歌单" />
          <TabButton active={tab === 'upload'} onClick={() => setTab('upload')} icon={<Upload className="w-3.5 h-3.5" />} label="上传音乐" />
          {isAdmin && (
            <TabButton active={tab === 'admin'} onClick={() => setTab('admin')} icon={<ShieldCheck className="w-3.5 h-3.5" />} label={`审核队列 (${pending.length})`} />
          )}
          <div className="ml-auto flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索歌曲 / 歌手..."
                className="w-full h-8 pl-8 pr-3 text-[11px] border border-slate-200 outline-none focus:border-[#0033a0] bg-white bp-no-elevate"
              />
            </div>
            <button
              onClick={playRandom}
              className="flex items-center gap-1.5 h-8 px-3 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider transition-colors bp-no-elevate"
              title="随机播放一首"
            >
              <Shuffle className="w-3.5 h-3.5" />
              随机播放
            </button>
          </div>
        </div>
      </div>

      {/* 全部歌曲 */}
      {tab === 'all' && (
        <CollapsibleCard
          title={`歌曲列表 · ${filtered.length} 首`}
          sub={search.trim() ? `搜索"${search.trim()}"` : '含全部已审核歌曲'}
          collapsed={collapsedAll}
          onToggle={() => setCollapsedAll((v) => !v)}
        >
          <SongTable
            songs={filtered}
            currentId={current?.song_id}
            playing={playing}
            onPlay={playSongRow}
            onToggle={toggle}
            onAddToPlaylist={playlists.length > 0 ? addToPlaylist : undefined}
            playlists={playlists}
            onDelete={canDelete ? handleDelete : undefined}
            showStatus={false}
            showIndex
            emptyText={search.trim() ? '没有匹配的歌曲' : '暂无歌曲，去「上传音乐」分享你的歌单'}
            hasSearch={!!search.trim()}
          />
        </CollapsibleCard>
      )}

      {/* 我的歌单 */}
      {tab === 'playlists' && (
        <div className="space-y-6">
          {/* 输入歌单代码查看 */}
          <div className="report-card p-4">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">🔗 查看别人的歌单</div>
            <div className="flex gap-2 max-w-lg">
              <Input
                value={shareCodeInput}
                onChange={(e) => setShareCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void viewShared()}
                placeholder="输入歌单分享码（6 位，如 A1B2C3）"
                className="h-9 flex-1 font-mono uppercase rounded-none bp-no-elevate"
              />
              <Button onClick={() => void viewShared()} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">
                查看
              </Button>
            </div>
            {sharedPlaylist && (
              <div className="mt-3">
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 thin-border mb-2">
                  <span className="text-[11px] font-black text-amber-700">
                    {sharedPlaylist.owner === 'root' ? '👑 ' : ''}{sharedPlaylist.name}
                  </span>
                  <span className="text-[9px] text-slate-400">by {sharedPlaylist.owner} · {sharedPlaylist.songs.length} 首</span>
                </div>
                {sharedPlaylist.songs.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2 px-3">该歌单为空或歌曲未公开</div>
                ) : (
                  <SongTable
                    songs={sharedPlaylist.songs}
                    currentId={current?.song_id}
                    playing={playing}
                    onPlay={playSongRow}
                    onToggle={toggle}
                    showStatus={false}
                    showIndex
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={createPlaylist} className="bg-[#0033a0] hover:bg-[#002580] rounded-none">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> 新建歌单
            </Button>
          </div>
          {playlists.length === 0 && (
            <div className="report-card p-10 text-center">
              <div className="text-3xl mb-2">🎵</div>
              <div className="text-xs font-bold text-slate-600">还没有歌单</div>
              <div className="text-[11px] text-slate-400 mt-1">创建一个歌单，把喜欢的歌收进去</div>
            </div>
          )}
          {playlists.map((pl) => (
            <CollapsibleCard
              key={pl.playlist_id}
              title={`${pl.name} · ${pl.song_count} 首`}
              sub=""
              collapsed={!!collapsedPls[pl.playlist_id]}
              onToggle={() =>
                setCollapsedPls((prev) => ({ ...prev, [pl.playlist_id]: !prev[pl.playlist_id] }))
              }
              action={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sharePlaylist(pl.playlist_id)}
                    className="text-slate-300 hover:text-[#0033a0] transition-colors"
                    title="分享歌单（复制分享码）"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deletePlaylist(pl.playlist_id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="删除歌单"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            >
              {pl.songs.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-3 px-4">歌单为空，去「全部歌曲」添加</div>
              ) : (
                <SongTable
                  songs={pl.songs}
                  currentId={current?.song_id}
                  playing={playing}
                  onPlay={playSongRow}
                  onToggle={toggle}
                  onRemoveFromPlaylist={(songId) => removeFromPlaylist(pl.playlist_id, songId)}
                  showStatus={false}
                  showIndex
                />
              )}
            </CollapsibleCard>
          ))}
        </div>
      )}

      {/* 上传 */}
      {tab === 'upload' && (
        <div className="report-card p-6">
          <div className="section-label mb-1">Upload Music</div>
          <div className="section-subtitle mb-5">上传后进入审核队列，root 通过后全体可听；审核前仅你本人可听</div>
          <form onSubmit={handleUpload} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="table-header">歌曲名 · TITLE</label>
                <Input name="title" placeholder="例如：Shape of You" className="h-10 rounded-none bp-no-elevate" />
              </div>
              <div className="space-y-1.5">
                <label className="table-header">歌手 · ARTIST</label>
                <Input name="artist" placeholder="例如：Ed Sheeran" className="h-10 rounded-none bp-no-elevate" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="table-header">音频文件 · FILE (mp3/wav/ogg/flac/m4a)</label>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
                className="block w-full text-[11px] text-slate-500 file:mr-3 file:px-3 file:py-2 file:bg-[#0033a0] file:text-white file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:cursor-pointer hover:file:bg-[#002580] bp-no-elevate"
              />
            </div>
            <Button type="submit" disabled={uploading} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-10 px-6">
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? '上传中...' : '上传音乐'}
            </Button>
          </form>

          {/* 我的上传记录 */}
          {mine.length > 0 && (
            <div className="mt-8">
              <CollapsibleCard
                title={`我的上传 · ${mine.length} 首`}
                sub="审核通过前仅你本人可听"
                collapsed={collapsedMine}
                onToggle={() => setCollapsedMine((v) => !v)}
              >
                <SongTable
                  songs={mine}
                  currentId={current?.song_id}
                  playing={playing}
                  onPlay={playSongRow}
                  onToggle={toggle}
                  onDelete={handleDelete}
                  showStatus
                  showIndex
                />
              </CollapsibleCard>
            </div>
          )}
        </div>
      )}

      {/* root 审核 */}
      {tab === 'admin' && isAdmin && (
        <div className="report-card p-6">
          <div className="section-label mb-1">Review Queue · 审核队列</div>
          <div className="section-subtitle mb-5">处理用户上传的歌曲，通过后全体可听；重复文件会被自动拦截</div>
          {pending.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-xs font-bold text-slate-600">队列已清空，暂无待审核歌曲</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((s) => (
                <div key={s.song_id} className="flex items-center gap-3 p-3 bg-slate-50 thin-border">
                  <Music2 className="w-4 h-4 text-[#0033a0] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-black text-slate-800 truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {s.artist} · 上传者 {s.user_id} · {fmtBytes(s.size)} · {s.filename}
                    </div>
                  </div>
                  <button onClick={() => playSongRow(s)} className="text-[#0033a0] hover:text-[#002580]" title="试听">
                    {isCurrent(s.song_id) && playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleApprove(s.song_id, 'approve')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider"
                  >
                    <CheckCircle2 className="w-3 h-3" /> 通过
                  </button>
                  <button
                    onClick={() => handleApprove(s.song_id, 'reject')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider"
                  >
                    <XCircle className="w-3 h-3" /> 拒绝
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 可折叠卡片容器 */
function CollapsibleCard({
  title,
  sub,
  collapsed,
  onToggle,
  action,
  children,
}: {
  title: string;
  sub?: string;
  collapsed: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="report-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 thin-border-b">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 min-w-0 flex-1 text-left bp-no-elevate"
          title={collapsed ? '展开列表' : '折叠列表'}
        >
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${collapsed ? '-rotate-90' : ''}`} />
          <span className="section-label truncate">{title}</span>
          {sub && <span className="text-[10px] text-slate-400 truncate hidden sm:inline">{sub}</span>}
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-slate-300 shrink-0">
            {collapsed ? '已折叠 · 点击展开' : '收起'}
          </span>
        </button>
        {action}
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors bp-no-elevate ${
        active ? 'bg-[#0033a0] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SongTable({
  songs,
  currentId,
  playing,
  onPlay,
  onToggle,
  onAddToPlaylist,
  playlists,
  onRemoveFromPlaylist,
  onDelete,
  showStatus,
  showIndex,
  emptyText,
  hasSearch,
}: {
  songs: SongRow[];
  currentId?: string;
  playing: boolean;
  onPlay: (s: SongRow) => void;
  onToggle: () => void;
  onAddToPlaylist?: (plId: string, songId: string) => void;
  playlists?: PlaylistRow[];
  onRemoveFromPlaylist?: (songId: string) => void;
  onDelete?: (s: SongRow) => void;
  showStatus: boolean;
  showIndex?: boolean;
  emptyText?: string;
  hasSearch?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50">
            <th className="table-header px-4 py-2.5 w-14">{showIndex ? '#' : ''}</th>
            <th className="table-header px-4 py-2.5">歌曲</th>
            <th className="table-header px-4 py-2.5 hidden sm:table-cell">歌手</th>
            <th className="table-header px-4 py-2.5 hidden md:table-cell">大小</th>
            {showStatus && <th className="table-header px-4 py-2.5">状态</th>}
            <th className="table-header px-4 py-2.5 text-right w-28">操作</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {songs.map((s, i) => (
              <motion.tr
                key={s.song_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-t thin-border-b ${isCurrentRow(s.song_id, currentId) ? 'bg-[#0033a0]/5' : 'hover:bg-slate-50/60'}`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {showIndex && (
                      <span className="text-[10px] font-mono font-bold text-slate-300 tabular-nums w-4 text-right">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    )}
                    <button
                      onClick={() => (isCurrentRow(s.song_id, currentId) ? onToggle() : onPlay(s))}
                      className="w-7 h-7 flex items-center justify-center text-white bg-[#0033a0] hover:bg-[#002580] transition-colors"
                      title="播放"
                    >
                      {isCurrentRow(s.song_id, currentId) && playing ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Music2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="text-[12px] font-bold text-slate-700 truncate max-w-[220px]">{s.title}</span>
                    {isCurrentRow(s.song_id, currentId) && (
                      <span className="text-[9px] font-black text-[#0033a0] uppercase tracking-wider shrink-0">Now</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell text-[11px] text-slate-500">{s.artist}</td>
                <td className="px-4 py-2.5 hidden md:table-cell text-[11px] font-mono text-slate-400">{fmtBytes(s.size)}</td>
                {showStatus && (
                  <td className="px-4 py-2.5">
                    <StatusBadge status={s.status} />
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {onAddToPlaylist && playlists && (
                      <select
                        className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1 py-1 outline-none bp-no-elevate"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onAddToPlaylist(e.target.value, s.song_id);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">+ 歌单</option>
                        {playlists.map((p) => (
                          <option key={p.playlist_id} value={p.playlist_id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {onRemoveFromPlaylist && (
                      <button
                        onClick={() => onRemoveFromPlaylist(s.song_id)}
                        className="text-slate-300 hover:text-red-500"
                        title="移出歌单"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(s)}
                        className="text-slate-300 hover:text-red-500"
                        title="删除歌曲"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {songs.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-3xl mb-2">🎧</div>
          <div className="text-xs font-bold text-slate-600">
            {emptyText || '暂无歌曲'}
          </div>
          {!hasSearch && (
            <div className="text-[11px] text-slate-400 mt-1">去「上传音乐」分享你的歌单，或等 root 审核通过更多歌曲</div>
          )}
        </div>
      )}
    </div>
  );
}

function isCurrentRow(id: string, currentId?: string): boolean {
  return !!currentId && id === currentId;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: '已通过', cls: 'bg-emerald-50 text-emerald-600' },
    pending: { label: '审核中', cls: 'bg-amber-50 text-amber-600' },
    rejected: { label: '未通过', cls: 'bg-red-50 text-red-500' },
  };
  const s = map[status] || map.pending;
  return <span className={`text-[9px] font-black px-1.5 py-0.5 ${s.cls}`}>{s.label}</span>;
}

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}
