import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Moon, Sunrise } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';
import { getWeeklyReport, fmtWeekRange } from '@/data/weekly';
import { TASK_TYPE_LABELS, TASK_TYPE_ICONS } from '@/data/game';

/**
 * 本周战绩：自然周任务统计 + 幽默总结
 */
export default function WeeklyReportCard() {
  const { tasks } = useGame();
  const report = useMemo(() => getWeeklyReport(tasks), [tasks]);

  return (
    <div className="report-card p-5 md:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-70" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
          <span className="section-label">Weekly Report · 本周战绩</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400 tabular-nums">
          {fmtWeekRange()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatTile label="本周任务" value={report.count} suffix="个" accent="#4F46E5" />
        <StatTile label="本周积分" value={report.points} suffix="exp" accent="#7C3AED" />
        <StatTile
          label="深夜任务"
          value={report.nightCount}
          suffix="个"
          accent={report.nightCount >= 5 ? '#DC2626' : '#64748B'}
          icon={<Moon className="w-3 h-3" />}
        />
        <StatTile
          label="清晨任务"
          value={report.morningCount}
          suffix="个"
          accent={report.morningCount >= 3 ? '#0D9488' : '#64748B'}
          icon={<Sunrise className="w-3 h-3" />}
        />
      </div>

      {/* 类型占比迷你条 */}
      {report.count > 0 && report.topType && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              类型构成 · Mix
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {TASK_TYPE_ICONS[report.topType]} {TASK_TYPE_LABELS[report.topType]}类最多（{report.topTypeCount} 个）
            </span>
          </div>
          <TypeMixBar tasks={tasks} />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-indigo-50 border-l-2 border-indigo-500 px-4 py-3"
      >
        <div className="text-[9px] font-black uppercase tracking-wider text-indigo-400 mb-1">
          Coach's Comment · 教练锐评
        </div>
        <div className="text-[13px] font-bold text-slate-700 leading-relaxed">
          {report.comment}
        </div>
      </motion.div>
    </div>
  );
}

function StatTile({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: number;
  suffix: string;
  accent: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-slate-50 thin-border">
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: accent }}>
        {icon}
        <span className="kpi-label" style={{ color: 'inherit' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black tabular-nums" style={{ color: accent }}>
          {value}
        </span>
        <span className="text-[10px] font-bold text-slate-400">{suffix}</span>
      </div>
    </div>
  );
}

function TypeMixBar({ tasks }: { tasks: { type: string }[] }) {
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tasks) m[t.type] = (m[t.type] || 0) + 1;
    return m;
  }, [tasks]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const order: { type: string; color: string }[] = [
    { type: 'study', color: '#3B82F6' },
    { type: 'work', color: '#6366F1' },
    { type: 'sport', color: '#10B981' },
    { type: 'life', color: '#F59E0B' },
    { type: 'other', color: '#94A3B8' },
  ];
  return (
    <div className="h-2 bg-slate-100 flex overflow-hidden">
      {order.map((o) => {
        const c = counts[o.type] || 0;
        if (c === 0) return null;
        return (
          <motion.div
            key={o.type}
            initial={{ width: 0 }}
            animate={{ width: `${(c / total) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ backgroundColor: o.color }}
            title={`${o.type}: ${c}`}
          />
        );
      })}
    </div>
  );
}
