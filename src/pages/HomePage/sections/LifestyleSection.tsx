import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Timer, CalendarDays, BookOpen, Smile, Sparkles, Hourglass, StickyNote,
  Quote, ListChecks, Utensils, Waves, Play, Pause, RotateCcw, Trash2, Plus, Gift, Flame,
} from 'lucide-react';
import SubTabBar from '@/components/SubTabBar';

import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExtraItem {
  id: number;
  kind: string;
  created_at: string;
  [key: string]: unknown;
}

type LTab = 'pomodoro' | 'calendar' | 'diary' | 'mood' | 'wish' | 'countdown' | 'note' | 'quote' | 'bucket' | 'food' | 'noise';

const LTABS: { id: LTab; label: string; emoji: string }[] = [
  { id: 'pomodoro', label: '番茄钟', emoji: '⏰' },
  { id: 'calendar', label: '打卡日历', emoji: '📅' },
  { id: 'diary', label: '日记本', emoji: '📝' },
  { id: 'mood', label: '心情', emoji: '🌈' },
  { id: 'wish', label: '许愿池', emoji: '🎋' },
  { id: 'countdown', label: '倒数日', emoji: '⏳' },
  { id: 'note', label: '便签', emoji: '📌' },
  { id: 'quote', label: '金句', emoji: '📖' },
  { id: 'bucket', label: '人生清单', emoji: '📜' },
  { id: 'food', label: '吃什么', emoji: '🍜' },
  { id: 'noise', label: '白噪音', emoji: '🌊' },
];

export default function LifestyleSection() {
  const { token } = useAuth();
  const [tab, setTab] = useState<LTab>('pomodoro');

  return (
    <div className="space-y-5">
      {/* 子功能导航 */}
      <div className="report-card p-3">
        <SubTabBar tabs={LTABS} active={tab} onChange={(id) => setTab(id as LTab)} />
      </div>

      {tab === 'pomodoro' && <PomodoroTab />}
      {tab === 'calendar' && <CalendarTab />}
      {tab === 'diary' && <DiaryTab />}
      {tab === 'mood' && <MoodTab />}
      {tab === 'wish' && <WishTab />}
      {tab === 'countdown' && <CountdownTab />}
      {tab === 'note' && <NoteTab />}
      {tab === 'quote' && <QuoteTab />}
      {tab === 'bucket' && <BucketTab />}
      {tab === 'food' && <FoodTab />}
      {tab === 'noise' && <NoiseTab />}
    </div>
  );
}

/* ---------- 通用数据 Hook ---------- */
function useExtras(kind: string) {
  const { token } = useAuth();
  const [items, setItems] = useState<ExtraItem[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/extras?kind=${kind}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) setItems(res.items);
    } catch {
      /* ignore */
    }
  }, [token, kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!token) return null;
      const res = await fetch('/api/extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind, payload }),
      }).then((r) => r.json());
      if (res.ok) void load();
      return res.ok ? res.id : null;
    },
    [token, kind, load],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!token) return;
      await fetch(`/api/extras/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      void load();
    },
    [token, load],
  );

  return { items, load, add, remove };
}

/* ---------- 番茄钟 ---------- */
function PomodoroTab() {
  const { items, add } = useExtras('pomodoro');
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          void add({ date: new Date().toISOString().slice(0, 10), minutes });
          toast.success('🍅 番茄完成！休息一下吧');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, minutes, add]);

  const todayCount = items.filter((i) => String(i.date) === new Date().toISOString().slice(0, 10)).length;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="report-card p-6 text-center">
        <div className="section-label mb-4">Pomodoro · 番茄专注</div>
        <div className="flex justify-center gap-2 mb-6">
          {[15, 25, 45].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMinutes(m);
                setSeconds(m * 60);
                setRunning(false);
              }}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border transition-colors bp-no-elevate ${
                minutes === m ? 'bg-[#0033a0] text-white border-[#0033a0]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {m} 分钟
            </button>
          ))}
        </div>
        <div className="text-6xl font-black text-[#0033a0] tabular-nums mb-6 font-mono">
          {mm}:{ss}
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={() => setRunning((r) => !r)} className="px-6 bg-[#0033a0] hover:bg-[#002580] rounded-none h-10">
            {running ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
            {running ? '暂停' : '开始'}
          </Button>
          <Button
            onClick={() => {
              setSeconds(minutes * 60);
              setRunning(false);
            }}
            className="px-4 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none h-10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-4 text-[11px] text-slate-400">
          今日已完成 <span className="font-black text-amber-500">{todayCount}</span> 个番茄 🍅
        </div>
      </div>

      <div className="report-card p-6">
        <div className="section-label mb-3">今日专注记录</div>
        {items.length === 0 && <div className="text-[11px] text-slate-400 py-6 text-center">还没有番茄记录，完成第一个番茄吧</div>}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {items.slice(0, 30).map((i) => (
            <div key={i.id} className="flex items-center gap-2 p-2 bg-slate-50 thin-border">
              <Timer className="w-3.5 h-3.5 text-[#0033a0]" />
              <span className="text-[11px] font-bold text-slate-600">{String(i.date)}</span>
              <span className="ml-auto text-[10px] font-black text-amber-500">🍅 ×{String(i.minutes)}min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 打卡日历（基于任务数据） ---------- */
function CalendarTab() {
  const { tasks } = useGame();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const taskByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      const d = new Date(t.completedAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [tasks]);

  const todayKey = `${year}-${month + 1}-${now.getDate()}`;
  const monthDone = Object.keys(taskByDay).filter((k) => k.startsWith(`${year}-${month + 1}-`)).length;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const heatColor = (d: number) => {
    const key = `${year}-${month + 1}-${d}`;
    const n = taskByDay[key] || 0;
    if (n === 0) return 'bg-slate-50 text-slate-300';
    if (n === 1) return 'bg-[#0033a0]/20 text-[#0033a0]';
    if (n <= 3) return 'bg-[#0033a0]/50 text-white';
    return 'bg-[#0033a0] text-white';
  };

  return (
    <div className="report-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="section-label">Month Calendar · 打卡日历</div>
          <div className="text-lg font-black text-slate-800">{year} 年 {month + 1} 月</div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          本月打卡 <span className="font-black text-[#0033a0]">{monthDone}</span> 天
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
          <div key={w} className="text-[9px] font-black uppercase text-slate-300 py-1">{w}</div>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <div key={`e${i}`} />
          ) : (
            <div
              key={d}
              className={`h-12 flex flex-col items-center justify-center text-[11px] font-bold rounded-sm transition-colors ${heatColor(d)} ${
                `${year}-${month + 1}-${d}` === todayKey ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              <span>{d}</span>
              {taskByDay[`${year}-${month + 1}-${d}`] > 0 && (
                <span className="text-[8px] font-black">{taskByDay[`${year}-${month + 1}-${d}`]}</span>
              )}
            </div>
          ),
        )}
      </div>
      <div className="mt-4 flex items-center gap-3 text-[9px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-50 inline-block" /> 0 个</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#0033a0]/20 inline-block" /> 1 个</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#0033a0]/50 inline-block" /> 2-3 个</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#0033a0] inline-block" /> 4+ 个</span>
        <span className="ml-auto">数字 = 当日任务数</span>
      </div>
    </div>
  );
}

/* ---------- 日记本 ---------- */
function DiaryTab() {
  const { items, add, remove } = useExtras('diary');
  const [content, setContent] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);
  const todays = items.filter((i) => String(i.date) === todayStr);

  const save = async () => {
    const text = content.trim();
    if (!text) return;
    const ok = await add({ date: todayStr, content: text });
    if (ok) {
      setContent('');
      toast.success('日记已保存 📝');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="report-card p-6">
        <div className="section-label mb-1">今天的日记 · {todayStr}</div>
        <div className="section-subtitle mb-4">记录今天的心情和收获，写给未来的自己</div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="今天发生了什么？..."
          rows={8}
          className="w-full text-[12px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate"
        />
        <Button onClick={() => void save()} disabled={!content.trim()} className="mt-3 bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">
          <BookOpen className="w-3.5 h-3.5 mr-1.5" /> 保存日记
        </Button>
        {todays.length > 0 && <div className="mt-2 text-[10px] text-emerald-500 font-bold">✓ 今天已写过 {todays.length} 篇</div>}
      </div>

      <div className="report-card p-6">
        <div className="section-label mb-3">日记列表</div>
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
          {items.length === 0 && <div className="text-[11px] text-slate-400 py-6 text-center">还没有日记</div>}
          {items.map((i) => (
            <div key={i.id} className="bg-slate-50 p-3 thin-border group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-[#0033a0]">{String(i.date)}</span>
                <button onClick={() => void remove(i.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap">{String(i.content)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 心情记录 ---------- */
const MOODS = [
  { emoji: '😄', label: '开心', color: 'bg-emerald-50 border-emerald-200' },
  { emoji: '😐', label: '平静', color: 'bg-sky-50 border-sky-200' },
  { emoji: '😢', label: '难过', color: 'bg-blue-50 border-blue-200' },
  { emoji: '😡', label: '生气', color: 'bg-red-50 border-red-200' },
  { emoji: '😴', label: '疲惫', color: 'bg-slate-50 border-slate-200' },
  { emoji: '🤩', label: '兴奋', color: 'bg-amber-50 border-amber-200' },
];

function MoodTab() {
  const { items, add, remove } = useExtras('mood');
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMood = items.find((i) => String(i.date) === todayStr);
  const last7 = useMemo(() => {
    const arr: { date: string; emoji: string }[] = [];
    for (let d = 6; d >= 0; d--) {
      const key = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
      const m = items.find((i) => String(i.date) === key);
      arr.push({ date: key, emoji: m ? String(m.emoji) : '·' });
    }
    return arr;
  }, [items]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="report-card p-6 text-center">
        <div className="section-label mb-4">今天的心情是？</div>
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.emoji}
              onClick={() => void add({ date: todayStr, emoji: m.emoji, label: m.label })}
              className={`p-4 border transition-all bp-no-elevate ${
                todayMood && String(todayMood.emoji) === m.emoji ? `${m.color} scale-105 shadow-sm` : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="text-3xl mb-1">{m.emoji}</div>
              <div className="text-[10px] font-bold text-slate-500">{m.label}</div>
            </button>
          ))}
        </div>
        {todayMood && (
          <div className="mt-4 text-[11px] text-slate-400">
            今日心情：<span className="text-base">{String(todayMood.emoji)}</span> {String(todayMood.label)}
          </div>
        )}
      </div>

      <div className="report-card p-6">
        <div className="section-label mb-3">最近 7 天心情</div>
        <div className="flex items-end justify-between gap-2 h-28 px-2">
          {last7.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="text-2xl">{d.emoji}</div>
              <div className="text-[8px] text-slate-300">{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
        <div className="section-label mt-6 mb-2">历史记录</div>
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
          {items.slice(0, 20).map((i) => (
            <div key={i.id} className="flex items-center gap-2 p-1.5 bg-slate-50 thin-border group">
              <span className="text-base">{String(i.emoji)}</span>
              <span className="text-[11px] font-bold text-slate-500">{String(i.label)}</span>
              <span className="ml-auto text-[9px] text-slate-300">{String(i.date)}</span>
              <button onClick={() => void remove(i.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 许愿池 ---------- */
function WishTab() {
  const { items, add, remove } = useExtras('wish');
  const [text, setText] = useState('');

  const draw = () => {
    const open = items.filter((i) => !i.done);
    if (open.length === 0) {
      toast.info('许愿池空空如也，先许个愿吧');
      return;
    }
    const w = open[Math.floor(Math.random() * open.length)];
    toast.success(`🎋 抽中了愿望：${String(w.text)}`, { description: '去实现它吧！' });
  };

  return (
    <div className="report-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-4 h-4 text-[#0033a0]" />
        <span className="section-label">Wishing Pond · 许愿池</span>
        <Button onClick={draw} className="ml-auto bg-amber-500 hover:bg-amber-600 rounded-none h-8 px-3 text-[10px]">
          <Sparkles className="w-3 h-3 mr-1" /> 随机抽一个
        </Button>
      </div>
      <div className="flex gap-2 mb-4 max-w-lg">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              void add({ text: text.trim(), done: false });
              setText('');
            }
          }}
          placeholder="写下你的愿望..."
          className="h-9 rounded-none bp-no-elevate"
        />
        <Button
          onClick={() => {
            if (!text.trim()) return;
            void add({ text: text.trim(), done: false });
            setText('');
          }}
          className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.length === 0 && <div className="text-[11px] text-slate-400 py-6 text-center col-span-full">许下你的第一个愿望吧 🌟</div>}
        {items.map((i) => (
          <div key={i.id} className={`p-3 border thin-border group ${i.done ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50'}`}>
            <div className="flex items-start gap-2">
              <button
                onClick={() => void add({ ...i, done: !i.done })}
                className="text-lg shrink-0"
                title={i.done ? '取消完成' : '标记完成'}
              >
                {i.done ? '✅' : '🎋'}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-[12px] font-bold text-slate-700 ${i.done ? 'line-through text-slate-400' : ''}`}>{String(i.text)}</div>
                <div className="text-[9px] text-slate-300 mt-0.5">{String(i.created_at).slice(0, 16).replace('T', ' ')}</div>
              </div>
              <button onClick={() => void remove(i.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 倒数日 ---------- */
function CountdownTab() {
  const { items, add, remove } = useExtras('countdown');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const daysLeft = (d: string) => {
    const diff = new Date(d).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime();
    return Math.round(diff / 86400000);
  };

  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Countdown · 倒数日</div>
      <div className="flex gap-2 mb-5 max-w-lg">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="事件名称，如：生日/考试/纪念日" className="h-9 flex-1 rounded-none bp-no-elevate" />
        <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="h-9 w-40 rounded-none bp-no-elevate" />
        <Button
          onClick={() => {
            if (!title.trim() || !date) return;
            void add({ title: title.trim(), date });
            setTitle('');
            setDate('');
          }}
          disabled={!title.trim() || !date}
          className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.length === 0 && <div className="text-[11px] text-slate-400 py-6 text-center col-span-full">添加一个重要的日子</div>}
        {items.map((i) => {
          const d = daysLeft(String(i.date));
          return (
            <div key={i.id} className="p-4 bg-slate-50 thin-border group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-black text-slate-800 truncate">{String(i.title)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{String(i.date)}</div>
                </div>
                <button onClick={() => void remove(i.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={`mt-3 text-2xl font-black tabular-nums ${d > 0 ? 'text-[#0033a0]' : d === 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                {d > 0 ? `还有 ${d} 天` : d === 0 ? '就是今天！' : `已过 ${-d} 天`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 便签 ---------- */
function NoteTab() {
  const { items, add, remove } = useExtras('note');
  const [text, setText] = useState('');
  const colors = ['bg-amber-50', 'bg-emerald-50', 'bg-sky-50', 'bg-rose-50', 'bg-violet-50'];

  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Sticky Notes · 便签墙</div>
      <div className="flex gap-2 mb-5 max-w-lg">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              void add({ text: text.trim() });
              setText('');
            }
          }}
          placeholder="记点东西... 灵感/待办/提醒"
          className="h-9 flex-1 rounded-none bp-no-elevate"
        />
        <Button
          onClick={() => {
            if (!text.trim()) return;
            void add({ text: text.trim() });
            setText('');
          }}
          className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.length === 0 && <div className="text-[11px] text-slate-400 py-6 text-center col-span-full">贴一张便签吧</div>}
        {items.map((i, idx) => (
          <div key={i.id} className={`${colors[idx % colors.length]} p-3 border border-slate-100 group relative`}>
            <div className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">{String(i.text)}</div>
            <button
              onClick={() => void remove(i.id)}
              className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 金句收藏 ---------- */
function QuoteTab() {
  const { items, add, remove } = useExtras('quote');
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');

  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Quote Collection · 金句收藏</div>
      <div className="flex gap-2 mb-5 max-w-2xl">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="收藏一句触动你的话..." className="h-9 flex-1 rounded-none bp-no-elevate" />
        <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="出处/作者(可选)" className="h-9 w-40 rounded-none bp-no-elevate" />
        <Button
          onClick={() => {
            if (!text.trim()) return;
            void add({ text: text.trim(), author: author.trim() || '佚名' });
            setText('');
            setAuthor('');
          }}
          disabled={!text.trim()}
          className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9"
        >
          <Quote className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="space-y-3 max-h-[420px] overflow-y-auto">
        {items.length === 0 && <div className="text-[11px] text-slate-400 py-6 text-center">收藏你的第一句金句</div>}
        {items.map((i) => (
          <div key={i.id} className="p-4 bg-slate-50 thin-border group">
            <div className="text-[13px] text-slate-700 leading-relaxed">“{String(i.text)}”</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-black text-[#0033a0]">—— {String(i.author)}</span>
              <button onClick={() => void remove(i.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 人生清单 ---------- */
const BUCKET_DEFAULT = [
  '看一次极光', '学会游泳', '跑一次马拉松', '去西藏旅行', '写一本书',
  '学会一门乐器', '看一次日出', '养一只宠物', '学会做饭', '给父母买礼物',
  '看 100 本书', '存下第一桶金', '学一门外语', '跳一次伞', '看一场演唱会',
  '种一棵树', '拍一组写真', '说走就走的旅行', '学会骑摩托', '完成一个 100 天的坚持',
];

function BucketTab() {
  const { items, add, remove } = useExtras('bucket');
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="report-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="section-label">Bucket List · 人生清单</div>
          <div className="text-[10px] text-slate-400">这辈子想做的事，做一件划一件</div>
        </div>
        <div className="text-[11px] font-black text-[#0033a0]">
          {doneCount} / {items.length} 已完成
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {items.length === 0 && <div className="text-[11px] text-slate-400 py-6 text-center col-span-full">点击下方按钮加入人生清单</div>}
        {items.map((i) => (
          <div key={i.id} className={`flex items-center gap-2 p-2.5 border thin-border group ${i.done ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50'}`}>
            <button
              onClick={() => void add({ ...i, done: !i.done })}
              className="text-lg shrink-0"
              title={i.done ? '取消' : '完成'}
            >
              {i.done ? '☑️' : '⬜'}
            </button>
            <span className={`text-[12px] font-bold flex-1 ${i.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{String(i.text)}</span>
            {i.done && <span className="text-[9px] font-black text-emerald-500 shrink-0">✓ 完成</span>}
            <button onClick={() => void remove(i.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {BUCKET_DEFAULT.filter((b) => !items.some((i) => String(i.text) === b)).map((b) => (
          <button
            key={b}
            onClick={() => void add({ text: b, done: false })}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#0033a0]/10 text-[10px] font-bold text-slate-500 rounded-full transition-colors bp-no-elevate"
          >
            + {b}
          </button>
        ))}
        <button
          onClick={() => {
            const t = window.prompt('自定义清单项：');
            if (t?.trim()) void add({ text: t.trim(), done: false });
          }}
          className="px-2.5 py-1.5 bg-[#0033a0] text-white text-[10px] font-black rounded-full bp-no-elevate"
        >
          + 自定义
        </button>
      </div>
    </div>
  );
}

/* ---------- 今日吃什么 ---------- */
const FOOD_POOL = {
  breakfast: ['豆浆油条', '煎饼果子', '燕麦牛奶', '包子稀饭', '三明治', '肠粉', '煮鸡蛋+牛奶', '小笼包', '南瓜粥', '面包+咖啡'],
  lunch: ['兰州拉面', '黄焖鸡米饭', '麻辣烫', '盖浇饭', '汉堡薯条', '饺子', '沙县小吃', '猪脚饭', '炒河粉', '寿司', '螺蛳粉', '煲仔饭'],
  dinner: ['火锅', '烤肉', '日料', '家常小炒', '酸菜鱼', '烧烤', '披萨', '越南粉', '咖喱饭', '水煮鱼', '烤鸭', '清淡粥+小菜'],
  snack: ['奶茶', '冰淇淋', '炸鸡', '水果捞', '烤串', '蛋糕', '关东煮', '糖炒栗子'],
};

function FoodTab() {
  const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const pick = () => {
    const pool = FOOD_POOL[meal];
    const r = pool[Math.floor(Math.random() * pool.length)];
    setResult(r);
    setHistory((h) => [r, ...h].slice(0, 5));
  };

  const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' } as const;

  return (
    <div className="report-card p-6 text-center">
      <div className="section-label mb-4">What to Eat · 今天吃什么</div>
      <div className="flex justify-center gap-2 mb-6">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors bp-no-elevate ${
              meal === m ? 'bg-[#0033a0] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {labels[m]}
          </button>
        ))}
      </div>
      <motion.div key={result || 'empty'} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl font-black text-[#0033a0] mb-6 min-h-[56px] flex items-center justify-center">
        {result || '🤔'}
      </motion.div>
      <Button onClick={pick} className="px-8 bg-[#0033a0] hover:bg-[#002580] rounded-none h-10">
        <Utensils className="w-4 h-4 mr-2" /> 帮我决定{labels[meal]}！
      </Button>
      {history.length > 0 && (
        <div className="mt-5 flex justify-center gap-2 flex-wrap">
          {history.map((h, i) => (
            <span key={i} className={`text-[10px] font-bold px-2 py-1 ${i === 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>{h}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 白噪音 ---------- */
function NoiseTab() {
  const [kind, setKind] = useState<'rain' | 'wave' | 'fire' | 'white'>('rain');
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode; src?: AudioBufferSourceNode } | null>(null);

  const stop = () => {
    if (nodesRef.current) {
      try {
        nodesRef.current.gain.disconnect();
        nodesRef.current.src?.stop();
      } catch {
        /* ignore */
      }
      nodesRef.current = null;
    }
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
    setPlaying(false);
  };

  const start = () => {
    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    gain.connect(ctx.destination);

    if (kind === 'white') {
      // 白噪声
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(gain);
      src.start();
      nodesRef.current = { gain, src };
    } else {
      // 着色噪声模拟 雨/海浪/篝火
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (kind === 'rain') {
          last = (last + 0.02 * white) / 1.02; // 低频褐噪更像雨
          data[i] = white * 0.6 + last * 2.2;
        } else if (kind === 'wave') {
          const t = i / ctx.sampleRate;
          const swell = Math.max(0, Math.sin(t * 0.4)) ** 3;
          data[i] = white * (0.25 + swell * 0.9);
        } else {
          // fire: 噼啪感
          last = (last + 0.1 * white) / 1.1;
          data[i] = white * (0.5 + Math.random() * 0.8) + last * 1.8;
        }
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(gain);
      src.start();
      nodesRef.current = { gain, src };
    }
    setPlaying(true);
  };

  useEffect(() => stop, []);

  const kinds = [
    { id: 'rain', label: '雨声', emoji: '🌧️' },
    { id: 'wave', label: '海浪', emoji: '🌊' },
    { id: 'fire', label: '篝火', emoji: '🔥' },
    { id: 'white', label: '白噪', emoji: '📻' },
  ] as const;

  return (
    <div className="report-card p-6 text-center">
      <div className="section-label mb-4">White Noise · 白噪音</div>
      <div className="flex justify-center gap-3 mb-8">
        {kinds.map((k) => (
          <button
            key={k.id}
            onClick={() => {
              setKind(k.id);
              if (playing && kind !== k.id) start();
            }}
            className={`w-20 py-4 border transition-all bp-no-elevate ${kind === k.id ? 'border-[#0033a0] bg-[#0033a0]/5 scale-105' : 'bg-white border-slate-100 hover:border-slate-300'}`}
          >
            <div className="text-2xl mb-1">{k.emoji}</div>
            <div className="text-[9px] font-bold text-slate-500">{k.label}</div>
          </button>
        ))}
      </div>
      <Button onClick={() => (playing ? stop() : start())} className={`px-10 h-11 rounded-none ${playing ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0033a0] hover:bg-[#002580]'}`}>
        {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
        {playing ? '停止' : '播放'} {kinds.find((k) => k.id === kind)?.emoji}
      </Button>
      <div className="mt-4 text-[10px] text-slate-400">浏览器实时生成，无需任何音频文件</div>
    </div>
  );
}
