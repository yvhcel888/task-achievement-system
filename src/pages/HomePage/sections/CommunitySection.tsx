import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageCircle, StickyNote, Users, Megaphone, Send, Trash2,
  Crown, ShieldCheck, ShieldOff, Loader2, Pin, User as UserIcon,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMsg {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
}
interface WallMsg extends ChatMsg {}
interface Announcement {
  id: number;
  user_id: string;
  title: string;
  content: string;
  pinned: number;
  created_at: string;
}
interface UserRow {
  user_id: string;
  role: string;
  totalTasks: number;
  totalPoints: number;
  level: number;
  achievements: number;
  equippedTitle: string | null;
  lastActive: string | null;
}

type Tab = 'chat' | 'wall' | 'users' | 'admin';

export default function CommunitySection() {
  const { token, userId } = useAuth();
  const [tab, setTab] = useState<Tab>('chat');
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [wallMsgs, setWallMsgs] = useState<WallMsg[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [wallInput, setWallInput] = useState('');
  const [sending, setSending] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const lastChatId = useRef(0);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const wallBoxRef = useRef<HTMLDivElement>(null);

  const loadAnnouncements = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/announcements').then((r) => r.json());
      if (res.ok) setAnnouncements(res.announcements);
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadChat = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat?after=${lastChatId.current}`).then((r) => r.json());
      if (res.ok && res.messages.length > 0) {
        setChatMsgs((prev) => [...prev, ...res.messages].slice(-200));
        lastChatId.current = res.messages[res.messages.length - 1].id;
      }
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadWall = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/wall').then((r) => r.json());
      if (res.ok) setWallMsgs(res.messages);
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) {
        setUsers(res.users);
        const me = res.users.find((u: UserRow) => u.user_id === userId);
        setIsAdmin(me?.role === 'admin' || userId === 'root');
      }
    } catch {
      /* ignore */
    }
  }, [token, userId]);

  useEffect(() => {
    if (!token) return;
    void loadAnnouncements();
    void loadWall();
    void loadUsers();
    void loadChat();
    const timer = setInterval(() => void loadChat(), 3000);
    return () => clearInterval(timer);
  }, [token, loadAnnouncements, loadWall, loadUsers, loadChat]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMsgs]);

  useEffect(() => {
    wallBoxRef.current?.scrollTo({ top: wallBoxRef.current.scrollHeight });
  }, [wallMsgs]);

  const sendChat = async () => {
    const content = chatInput.trim();
    if (!content || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      }).then((r) => r.json());
      if (res.ok) {
        setChatInput('');
        await loadChat();
      } else {
        toast.error(res.message || '发送失败');
      }
    } catch {
      toast.error('发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const sendWall = async () => {
    const content = wallInput.trim();
    if (!content || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      }).then((r) => r.json());
      if (res.ok) {
        setWallInput('');
        await loadWall();
      } else {
        toast.error(res.message || '留言失败');
      }
    } catch {
      toast.error('留言失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const deleteWall = async (id: number) => {
    if (!token) return;
    if (!window.confirm('确定删除这条留言？')) return;
    const res = await fetch(`/api/wall/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    if (res.ok) {
      toast.success('已删除');
      void loadWall();
    } else {
      toast.error(res.message || '删除失败');
    }
  };

  const publishAnnouncement = async () => {
    const title = annTitle.trim();
    const content = annContent.trim();
    if (!title || !content || !token) return;
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, content, pinned: 1 }),
    }).then((r) => r.json());
    if (res.ok) {
      toast.success('公告已发布');
      setAnnTitle('');
      setAnnContent('');
      void loadAnnouncements();
    } else {
      toast.error(res.message || '发布失败');
    }
  };

  const deleteAnnouncement = async (id: number) => {
    if (!token) return;
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    if (res.ok) {
      toast.success('公告已删除');
      void loadAnnouncements();
    }
  };

  const setUserRole = async (target: string, role: 'admin' | 'user') => {
    if (!token) return;
    if (!window.confirm(`确定将 ${target} ${role === 'admin' ? '任命为管理员' : '撤销管理员'}？`)) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(target)}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    }).then((r) => r.json());
    if (res.ok) {
      toast.success(res.message);
      void loadUsers();
    } else {
      toast.error(res.message || '操作失败');
    }
  };

  const delChat = async (id: number) => {
    if (!token) return;
    if (!window.confirm('确定删除这条消息？')) return;
    const res = await fetch(`/api/chat/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (res.ok) {
      setChatMsgs((msgs) => msgs.filter((x) => x.id !== id));
      toast.success(res.message || '已删除');
    } else {
      toast.error(res.message || '删除失败');
    }
  };

  const fmtTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (sameDay) return hhmm;
    return `${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
  };

  return (
    <div className="space-y-5">
      {/* 公告横幅 */}
      {announcements.length > 0 && (
        <div className="report-card p-3 flex items-center gap-3 bg-gradient-to-r from-[#0033a0]/5 to-transparent">
          <Megaphone className="w-4 h-4 text-[#0033a0] shrink-0 animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-black text-[#0033a0] truncate">
              📢 {announcements[0].title}
            </div>
            <div className="text-[10px] text-slate-500 truncate">{announcements[0].content}</div>
          </div>
          <div className="text-[9px] text-slate-400 shrink-0">{fmtTime(announcements[0].created_at)}</div>
        </div>
      )}

      {/* Tab 栏 */}
      <div className="report-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} icon={<MessageCircle className="w-3.5 h-3.5" />} label={`聊天室 (${chatMsgs.length})`} />
          <TabButton active={tab === 'wall'} onClick={() => setTab('wall')} icon={<StickyNote className="w-3.5 h-3.5" />} label={`留言墙 (${wallMsgs.length})`} />
          <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={<Users className="w-3.5 h-3.5" />} label={`用户广场 (${users.length})`} />
          {isAdmin && (
            <TabButton active={tab === 'admin'} onClick={() => setTab('admin')} icon={<Megaphone className="w-3.5 h-3.5" />} label="公告管理" />
          )}
        </div>
      </div>

      {/* 聊天室 */}
      {tab === 'chat' && (
        <div className="report-card overflow-hidden flex flex-col h-[480px]">
          <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
            {chatMsgs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <div className="text-3xl">💬</div>
                <div className="text-xs font-bold text-slate-600">聊天室还很安静</div>
                <div className="text-[11px] text-slate-400">发个消息，第一个开口的人永远是勇士</div>
              </div>
            )}
            {chatMsgs.map((m) => (
              <div key={m.id} className="flex gap-2.5 items-start group">
                <div
                  className={`w-7 h-7 shrink-0 flex items-center justify-center text-[11px] font-black text-white ${
                    m.user_id === 'root' ? 'bg-[#0033a0]' : 'bg-slate-400'
                  }`}
                >
                  {m.user_id === 'root' ? <Crown className="w-3.5 h-3.5" /> : m.user_id.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black ${m.user_id === 'root' ? 'text-[#0033a0]' : 'text-slate-600'}`}>
                      {m.user_id}
                      {m.user_id === 'root' && <span className="ml-1 text-[8px] bg-[#0033a0]/10 text-[#0033a0] px-1 py-px font-black">ROOT</span>}
                    </span>
                    <span className="text-[9px] text-slate-300">{fmtTime(m.created_at)}</span>
                    {(m.user_id === userId || isAdmin) && (
                      <button
                        onClick={() => void delChat(m.id)}
                        title="删除这条消息"
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t thin-border-t bg-white flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void sendChat();
                }
              }}
              placeholder="说点什么... (Enter 发送)"
              className="flex-1 h-9 px-3 text-[12px] border border-slate-200 outline-none focus:border-[#0033a0] bp-no-elevate"
            />
            <Button onClick={() => void sendChat()} disabled={sending || !chatInput.trim()} className="h-9 px-4 bg-[#0033a0] hover:bg-[#002580] rounded-none">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* 留言墙 */}
      {tab === 'wall' && (
        <div className="report-card overflow-hidden">
          <div ref={wallBoxRef} className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-slate-50/40">
            {wallMsgs.length === 0 && (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">📌</div>
                <div className="text-xs font-bold text-slate-600">留言墙空空如也</div>
                <div className="text-[11px] text-slate-400 mt-1">写下第一张便利贴吧</div>
              </div>
            )}
            {wallMsgs.map((m) => (
              <div key={m.id} className="bg-white border thin-border p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black text-slate-600">{m.user_id}</span>
                  <span className="text-[9px] text-slate-300">{fmtTime(m.created_at)}</span>
                  {(m.user_id === userId || isAdmin) && (
                    <button onClick={() => void deleteWall(m.id)} className="ml-auto text-slate-300 hover:text-red-500" title="删除">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t thin-border-t bg-white flex gap-2">
            <input
              value={wallInput}
              onChange={(e) => setWallInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void sendWall();
                }
              }}
              placeholder="写张便利贴贴上留言墙... (Enter 发布)"
              className="flex-1 h-9 px-3 text-[12px] border border-slate-200 outline-none focus:border-[#0033a0] bp-no-elevate"
            />
            <Button onClick={() => void sendWall()} disabled={sending || !wallInput.trim()} className="h-9 px-4 bg-[#0033a0] hover:bg-[#002580] rounded-none">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <StickyNote className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* 用户广场 */}
      {tab === 'users' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((u) => (
            <div key={u.user_id} className="report-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 flex items-center justify-center text-lg ${u.role === 'admin' ? 'bg-[#0033a0]/10' : 'bg-slate-100'}`}>
                  {u.role === 'admin' ? <Crown className="w-5 h-5 text-[#0033a0]" /> : <UserIcon className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-black text-slate-800 truncate">
                    {u.user_id}
                    {u.user_id === 'root' && <span className="ml-1.5 text-[8px] bg-[#0033a0] text-white px-1 py-px font-black align-middle">ROOT</span>}
                    {u.role === 'admin' && u.user_id !== 'root' && (
                      <span className="ml-1.5 text-[8px] bg-amber-100 text-amber-600 px-1 py-px font-black align-middle">管理员</span>
                    )}
                  </div>
                  {u.equippedTitle && <div className="text-[10px] text-[#0033a0] truncate">🎖️ {u.equippedTitle}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mb-3">
                <StatCell label="等级" value={`Lv.${u.level}`} />
                <StatCell label="积分" value={String(u.totalPoints)} />
                <StatCell label="任务" value={String(u.totalTasks)} />
                <StatCell label="成就" value={String(u.achievements)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-300">
                  {u.lastActive ? `最近活跃 ${fmtTime(u.lastActive)}` : '尚未活跃'}
                </span>
                {userId === 'root' && u.user_id !== 'root' && (
                  <button
                    onClick={() => void setUserRole(u.user_id, u.role === 'admin' ? 'user' : 'admin')}
                    className={`flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-colors ${
                      u.role === 'admin'
                        ? 'bg-white border border-red-200 text-red-500 hover:bg-red-50'
                        : 'bg-[#0033a0] text-white hover:bg-[#002580]'
                    }`}
                  >
                    {u.role === 'admin' ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {u.role === 'admin' ? '撤销' : '任命'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 公告管理（管理员） */}
      {tab === 'admin' && isAdmin && (
        <div className="space-y-6">
          <div className="report-card p-5">
            <div className="section-label mb-1">发布公告</div>
            <div className="section-subtitle mb-4">公告会显示在所有用户聊天室顶部</div>
            <div className="space-y-3 max-w-xl">
              <Input
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="公告标题"
                className="h-9 rounded-none bp-no-elevate"
              />
              <textarea
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="公告内容..."
                rows={3}
                className="w-full text-[12px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate"
              />
              <Button onClick={() => void publishAnnouncement()} disabled={!annTitle.trim() || !annContent.trim()} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">
                <Megaphone className="w-3.5 h-3.5 mr-1.5" /> 发布公告
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="report-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  {a.pinned === 1 && <Pin className="w-3.5 h-3.5 text-[#0033a0]" />}
                  <span className="text-[13px] font-black text-slate-800">{a.title}</span>
                  <button onClick={() => void deleteAnnouncement(a.id)} className="ml-auto text-slate-300 hover:text-red-500" title="删除公告">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[12px] text-slate-600">{a.content}</div>
                <div className="text-[9px] text-slate-300 mt-1.5">by {a.user_id} · {fmtTime(a.created_at)}</div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="report-card p-8 text-center text-[11px] text-slate-400">暂无公告</div>
            )}
          </div>
        </div>
      )}
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

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 py-1.5">
      <div className="text-[12px] font-black text-slate-700">{value}</div>
      <div className="text-[8px] font-bold uppercase tracking-wider text-slate-300">{label}</div>
    </div>
  );
}
