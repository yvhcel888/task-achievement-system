import { motion, useTransform, useSpring } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { Flame, Trophy, Target, Zap } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';
import { getLevelTitle } from '@/data/game';

export default function PlayerStatsBar() {
  const { progress, lastGainedPoints } = useGame();
  const { level, totalPoints, currentExp, expToNextLevel, streakDays, totalTasks, unlockedAchievementIds } = progress;

  const expPercent = (currentExp / expToNextLevel) * 100;
  const animatedExp = useSpring(expPercent, { stiffness: 120, damping: 20 });

  useEffect(() => {
    animatedExp.set(expPercent);
  }, [expPercent, animatedExp]);

  const pointsSpring = useSpring(totalPoints, { stiffness: 100, damping: 20 });
  const pointsDisplay = useTransform(pointsSpring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    pointsSpring.set(totalPoints);
  }, [totalPoints, pointsSpring]);

  return (
    <div className="report-card p-6 relative overflow-hidden">
      {/* 积分飘字 */}
      {lastGainedPoints > 0 && (
        <motion.div
          key={lastGainedPoints}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -40 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute top-6 right-6 text-lg font-black text-[#0033a0] pointer-events-none tabular-nums z-10"
        >
          +{lastGainedPoints} EXP
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 等级模块 - 左侧突出 */}
        <div className="md:col-span-4 flex items-center gap-5">
          <div className="relative shrink-0">
            {/* 等级圆环 */}
            <div className="w-20 h-20 bg-[#0033a0] flex flex-col items-center justify-center text-white">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none">
                LEVEL
              </div>
              <div className="text-3xl font-black leading-none tabular-nums mt-0.5">
                {level}
              </div>
            </div>
            {/* 侧边 3px 强调线（呼应卡片顶边风格） */}
            <div className="absolute top-0 -left-1 bottom-0 w-1 bg-[#0033a0]" />
          </div>

          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
              Current Rank
            </div>
            <div className="text-xl font-bold text-slate-800 leading-tight mb-2">
              {getLevelTitle(level)}
            </div>
            {/* 经验进度条 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  Progress
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-500 tabular-nums">
                  {currentExp} / {expToNextLevel}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-[#0033a0]"
                  style={{ width: animatedExp }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 垂直分隔线 */}
        <div className="hidden md:block thin-border-r" style={{ width: 0 }} />

        {/* KPI 指标组 */}
        <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-4">
          <MetricBlock
            icon={<Trophy className="w-3.5 h-3.5" />}
            label="总积分"
            value={<motion.span className="tabular-nums">{pointsDisplay}</motion.span>}
            sub="TOTAL POINTS"
          />
          <MetricBlock
            icon={<Flame className="w-3.5 h-3.5" />}
            label="连续天数"
            value={`${streakDays} 天`}
            sub="CURRENT STREAK"
            highlight={streakDays >= 3 ? 'emerald' : undefined}
          />
          <MetricBlock
            icon={<Target className="w-3.5 h-3.5" />}
            label="已完成任务"
            value={`${totalTasks}`}
            sub="TASKS DONE"
          />
          <MetricBlock
            icon={<Zap className="w-3.5 h-3.5" />}
            label="成就徽章"
            value={`${unlockedAchievementIds.length}`}
            sub="ACHIEVEMENTS"
            isLast
          />
        </div>
      </div>
    </div>
  );
}

function MetricBlock({
  icon,
  label,
  value,
  sub,
  highlight,
  isLast,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub: string;
  highlight?: 'emerald';
  isLast?: boolean;
}) {
  return (
    <div className={`p-4 ${!isLast ? 'md:thin-border-r' : ''} thin-border-b md:thin-border-b-0`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#0033a0]">{icon}</span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value flex items-baseline gap-1">
        {value}
        {highlight === 'emerald' && (
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded uppercase tracking-tight">
            active
          </span>
        )}
      </div>
      <div className="text-[9px] font-black uppercase text-slate-300 tracking-wider mt-1">
        {sub}
      </div>
    </div>
  );
}
