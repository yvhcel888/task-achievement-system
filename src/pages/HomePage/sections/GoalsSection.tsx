import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Target, Gift, Plus, CheckCircle2, XCircle, Trash2, Trophy, Loader2, Flame } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  reward: string;
  target_tasks: number;
  status: 'active' | 'achieved' | 'abandoned';
  created_at: string;
  achieved_at: string | null;
}

export default function GoalsSection() {
  const { token } = useAuth();
  const { progress } = useGame();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('');
  const [targetTasks, setTargetTasks] = useState('');
  const [loading, setLoading] = useState(false);
  const [celebrated, setCelebrated] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/goals', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) setGoals(res.goals);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    const t = title.trim();
    const r = reward.trim();
    if (!t || !r || !token) {
      toast.error('请填写目标和奖励');
      return;
    }
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: t, reward: r, targetTasks: Number(targetTasks) || 0 }),
    }).then((r2) => r2.json());
    if (res.ok) {
      toast.success('目标已设立', { description: '冲鸭！完成它，奖励在向你招手' });
      setTitle('');
      setReward('');
      setTargetTasks('');
      void load();
    } else {
      toast.error(res.message || '创建失败');
    }
  };

  const achieve = async (g: Goal) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${g.id}/achieve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      if (res.ok) {
        setCelebrated(g.id);
        toast.success(res.message || '🎉 目标达成！');
        setTimeout(() => setCelebrated(null), 3000);
        void load();
      } else {
        toast.error(res.message || '操作失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const abandon = async (id: string) => {
    if (!token) return;
    if (!window.confirm('确定放弃这个目标？')) return;
    await fetch(`/api/goals/${id}/abandon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    void load();
  };

  const remove = async (id: string) => {
    if (!token) return;
    if (!window.confirm('确定删除这条记录？')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    void load();
  };

  const active = goals.filter((g) => g.status === 'active');
  const achieved = goals.filter((g) => g.status === 'achieved');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左：新建目标 */}
      <div className="lg:col-span-4 space-y-5">
        <div className="report-card p-5">
          <div className="section-label mb-1">设立目标 · SET A GOAL</div>
          <div className="section-subtitle mb-4">写下目标和奖励，完成它就去兑现！</div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="table-header">目标 · GOAL</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：连续打卡 7 天"
                className="h-9 rounded-none bp-no-elevate"
              />
            </div>
            <div className="space-y-1.5">
              <label className="table-header">奖励 · REWARD</label>
              <Input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="例如：奖励自己一杯奶茶 🧋"
                className="h-9 rounded-none bp-no-elevate"
              />
            </div>
            <div className="space-y-1.5">
              <label className="table-header">目标任务数（可选）· TARGET TASKS</label>
              <Input
                value={targetTasks}
                onChange={(e) => setTargetTasks(e.target.value)}
                type="number"
                min={0}
                placeholder="完成 N 个任务后自动达标（留空则手动达成）"
                className="h-9 rounded-none bp-no-elevate"
              />
            </div>
            <Button onClick={() => void create()} disabled={!title.trim() || !reward.trim()} className="w-full h-9 bg-[#0033a0] hover:bg-[#002580] rounded-none">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> 立下目标
            </Button>
          </div>
        </div>

        <div className="report-card p-4 bg-gradient-to-br from-[#0033a0]/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-black text-slate-700">激励小贴士</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-relaxed space-y-1.5">
            <p>· 目标要具体：不是"好好学习"，而是"背 50 个单词"</p>
            <p>· 奖励要让你心动：奶茶、游戏时间、买买买都可以</p>
            <p>· 达成后记得点「达成」，兑现奖励别手软</p>
            <p>· 失败了也别删，放弃和重新立目标都是勇气</p>
          </div>
        </div>
      </div>

      {/* 右：目标列表 */}
      <div className="lg:col-span-8 space-y-6">
        {/* 进行中 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#0033a0]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">进行中的目标 · {active.length}</span>
          </div>
          <div className="space-y-3">
            {active.length === 0 && (
              <div className="report-card p-8 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-xs font-bold text-slate-600">还没有目标</div>
                <div className="text-[11px] text-slate-400 mt-1">在左侧立一个目标，给自己一个奖励的理由</div>
              </div>
            )}
            {active.map((g) => {
              const progressPct = g.target_tasks > 0 ? Math.min(100, Math.round((progress.totalTasks / g.target_tasks) * 100)) : 0;
              const autoReady = g.target_tasks > 0 && progress.totalTasks >= g.target_tasks;
              return (
                <motion.div key={g.id} layout className="report-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#0033a0]/10 text-[#0033a0] flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-black text-slate-800">{g.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Gift className="w-3 h-3 text-amber-500" /> 奖励：{g.reward}
                      </div>
                      {g.target_tasks > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                            <span>任务进度 {progress.totalTasks}/{g.target_tasks}</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100">
                            <div className={`h-full transition-all ${autoReady ? 'bg-emerald-500' : 'bg-[#0033a0]'}`} style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      )}
                      {autoReady && (
                        <div className="mt-2 text-[10px] font-black text-emerald-500 animate-pulse">✨ 目标任务数已达成，快去兑现奖励！</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => void achieve(g)}
                        disabled={loading}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        达成
                      </button>
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => void abandon(g.id)} className="text-[9px] text-slate-300 hover:text-amber-500" title="放弃目标">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => void remove(g.id)} className="text-[9px] text-slate-300 hover:text-red-500" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 已达成 */}
        {achieved.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">已达成 · {achieved.length}</span>
            </div>
            <div className="space-y-2">
              {achieved.map((g) => (
                <motion.div key={g.id} className="report-card p-3.5 border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-black text-slate-700 line-through decoration-slate-300">{g.title}</div>
                      <div className="text-[10px] text-emerald-500 mt-0.5">🎁 {g.reward} — 记得兑现！</div>
                    </div>
                    <button onClick={() => void remove(g.id)} className="text-slate-200 hover:text-red-400" title="删除记录">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 达成庆祝浮层 */}
        <AnimatePresence>
          {celebrated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-8 py-6 bg-white border-2 border-emerald-400 shadow-2xl text-center"
            >
              <div className="text-4xl mb-2">🎉🏆🎉</div>
              <div className="text-sm font-black text-emerald-600">目标达成！</div>
              <div className="text-[11px] text-slate-500 mt-1">去兑现你的奖励吧！</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
