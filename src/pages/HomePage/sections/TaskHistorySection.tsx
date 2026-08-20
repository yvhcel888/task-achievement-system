import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ListChecks, Trash2 } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { toast } from 'sonner';

import { useGame, fmtDate } from '@/contexts/GameContext';
import {
  TASK_TYPE_LABELS,
  DIFFICULTY_LABELS,
  type TaskType,
  type TaskDifficulty,
} from '@/data/game';

const typeColorMap: Record<TaskType, { bg: string; text: string }> = {
  study: { bg: '#EFF6FF', text: '#1D4ED8' },
  work: { bg: '#F5F3FF', text: '#6D28D9' },
  sport: { bg: '#ECFDF5', text: '#047857' },
  life: { bg: '#FFFBEB', text: '#B45309' },
  other: { bg: '#F8FAFC', text: '#475569' },
};

const difficultyColorMap: Record<TaskDifficulty, { bg: string; text: string; bar: string }> = {
  easy: { bg: '#ECFDF5', text: '#047857', bar: '#10B981' },
  medium: { bg: '#FFFBEB', text: '#B45309', bar: '#F59E0B' },
  hard: { bg: '#FEF2F2', text: '#B91C1C', bar: '#EF4444' },
};

function dateLabel(ts: number): string {
  const day = fmtDate(ts);
  const today = fmtDate(Date.now());
  const yesterday = fmtDate(Date.now() - 86400000);
  if (day === today) return '今天';
  if (day === yesterday) return '昨天';
  return format(ts, 'yyyy年M月d日 EEEE', { locale: zhCN });
}

export default function TaskHistorySection() {
  const { tasks, removeTask } = useGame();
  const [listRef] = useAutoAnimate({ duration: 250, easing: 'ease-out' });

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => b.completedAt - a.completedAt),
    [tasks],
  );

  // 按天分组
  const groupedTasks = useMemo(() => {
    const groups: { label: string; day: string; tasks: typeof sortedTasks }[] = [];
    for (const task of sortedTasks.slice(0, 30)) {
      const day = fmtDate(task.completedAt);
      const last = groups[groups.length - 1];
      if (last && last.day === day) {
        last.tasks.push(task);
      } else {
        groups.push({ label: dateLabel(task.completedAt), day, tasks: [task] });
      }
    }
    return groups;
  }, [sortedTasks]);

  const typeSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    for (const t of tasks) {
      summary[t.type] = (summary[t.type] || 0) + 1;
    }
    return summary;
  }, [tasks]);

  const handleRemove = (id: string, name: string) => {
    removeTask(id);
    toast.info(`已删除任务「${name}」，积分已重新结算`);
  };

  return (
    <div className="report-card p-6 h-full flex flex-col">
      {/* Section Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="section-label mb-1">History Log</div>
          <div className="section-subtitle">任务完成记录 · 共 {tasks.length} 条</div>
        </div>

        {/* 类型汇总 */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
            {(Object.keys(TASK_TYPE_LABELS) as TaskType[])
              .filter((t) => (typeSummary[t] || 0) > 0)
              .map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-1 px-1.5 py-0.5"
                  style={{ backgroundColor: typeColorMap[t].bg }}
                >
                  <div
                    className="w-1 h-2.5"
                    style={{ backgroundColor: typeColorMap[t].text }}
                  />
                  <span
                    className="text-[9px] font-bold uppercase tracking-tight"
                    style={{ color: typeColorMap[t].text }}
                  >
                    {TASK_TYPE_LABELS[t]} {typeSummary[t]}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 表格头 */}
      {sortedTasks.length > 0 && (
        <div className="grid grid-cols-12 gap-2 pb-2 thin-border-b">
          <div className="col-span-5 table-header pl-2">任务</div>
          <div className="col-span-2 table-header text-center">类型</div>
          <div className="col-span-2 table-header text-center">难度</div>
          <div className="col-span-2 table-header text-right">积分</div>
          <div className="col-span-1 table-header text-right">操作</div>
        </div>
      )}

      {/* 任务列表 */}
      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-slate-50 flex items-center justify-center mb-3">
            <ListChecks className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-xs font-bold text-slate-500">暂无任务记录</p>
          <p className="text-[10px] text-slate-400 mt-1">
            提交第一个任务，开启你的成就之旅
          </p>
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex-1 bp-scrollbar overflow-y-auto max-h-[420px]"
        >
          {groupedTasks.map((group) => (
            <div key={group.day}>
              <div className="bp-group-header">{group.label}</div>
              {group.tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 22,
                    delay: i * 0.03,
                  }}
                  className="grid grid-cols-12 gap-2 items-center py-2.5 pl-2 pr-1 hover:bg-slate-50 transition-colors group thin-border-b last:thin-border-b-0"
                >
                  {/* 任务名 */}
                  <div className="col-span-5 min-w-0 flex items-center gap-2">
                    <div
                      className="w-1 h-3 shrink-0"
                      style={{ backgroundColor: difficultyColorMap[task.difficulty].bar }}
                    />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {task.name}
                    </span>
                  </div>

                  {/* 类型 */}
                  <div className="col-span-2 text-center">
                    <span
                      className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.5"
                      style={{
                        backgroundColor: typeColorMap[task.type].bg,
                        color: typeColorMap[task.type].text,
                      }}
                    >
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                  </div>

                  {/* 难度 */}
                  <div className="col-span-2 text-center">
                    <span
                      className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.5"
                      style={{
                        backgroundColor: difficultyColorMap[task.difficulty].bg,
                        color: difficultyColorMap[task.difficulty].text,
                      }}
                    >
                      {DIFFICULTY_LABELS[task.difficulty]}
                    </span>
                  </div>

                  {/* 积分 */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-mono font-bold text-[#0033a0] tabular-nums">
                      +{task.points}
                    </span>
                  </div>

                  {/* 删除 */}
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => handleRemove(task.id, task.name)}
                      className="inline-flex items-center justify-center w-6 h-6 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`删除任务 ${task.name}`}
                      title="删除该任务并重新结算积分"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
          {sortedTasks.length > 30 && (
            <div className="text-center py-2 text-[9px] font-bold uppercase text-slate-300 tracking-widest">
              — 仅显示最近 30 条 —
            </div>
          )}
        </div>
      )}
    </div>
  );
}
