import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

import { useGame, fmtDate } from '@/contexts/GameContext';
import { TASK_TYPE_LABELS, DIFFICULTY_LABELS, type TaskType, type TaskDifficulty } from '@/data/game';

const TYPE_COLORS: Record<TaskType, string> = {
  study: '#1D4ED8',
  work: '#6D28D9',
  sport: '#047857',
  life: '#B45309',
  other: '#64748B',
};

const DIFFICULTY_COLORS: Record<TaskDifficulty, string> = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
};

const BLUE = '#0033a0';

/** 近 N 天完成趋势 */
function buildTrend(tasks: { completedAt: number }[]): { days: string[]; counts: number[] } {
  const days: string[] = [];
  const counts: number[] = [];
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayKeys.push(fmtDate(d.getTime()));
    days.push(i === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`);
    counts.push(0);
  }
  for (const t of tasks) {
    const key = fmtDate(t.completedAt);
    const idx = dayKeys.indexOf(key);
    if (idx >= 0) counts[idx] += 1;
  }
  return { days, counts };
}

export default function StatsChartsSection() {
  const { tasks, progress } = useGame();
  const hasData = tasks.length > 0;

  const typeOption = useMemo(() => {
    const entries = (Object.keys(TASK_TYPE_LABELS) as TaskType[])
      .map((t) => ({ name: TASK_TYPE_LABELS[t], value: progress.taskCountsByType[t], type: t }))
      .filter((e) => e.value > 0);

    return {
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} 个 ({d}%)' },
      legend: {
        bottom: 0,
        icon: 'rect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10, color: '#64748B' },
      },
      series: [
        {
          name: '类型分布',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { show: true, fontSize: 10, fontWeight: 700, color: '#1e293b', formatter: '{c}' },
          data: entries.map((e) => ({ name: e.name, value: e.value, itemStyle: { color: TYPE_COLORS[e.type] } })),
        },
      ],
    };
  }, [progress.taskCountsByType]);

  const difficultyOption = useMemo(() => {
    const entries = (Object.keys(DIFFICULTY_LABELS) as TaskDifficulty[]).map((d) => ({
      name: DIFFICULTY_LABELS[d],
      value: progress.taskCountsByDifficulty[d],
      color: DIFFICULTY_COLORS[d],
    }));

    return {
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const }, formatter: '{b}: {c} 个' },
      grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value' as const, minInterval: 1, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { fontSize: 10, color: '#94a3b8' } },
      yAxis: {
        type: 'category' as const,
        data: entries.map((e) => e.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, fontWeight: 700, color: '#475569' },
      },
      series: [
        {
          name: '任务数',
          type: 'bar',
          barWidth: 14,
          data: entries.map((e) => ({ value: e.value, itemStyle: { color: e.color } })),
          label: { show: true, position: 'right' as const, fontSize: 10, fontWeight: 700, color: '#334155' },
        },
      ],
    };
  }, [progress.taskCountsByDifficulty]);

  const trendOption = useMemo(() => {
    const { days, counts } = buildTrend(tasks);
    return {
      tooltip: { trigger: 'axis' as const, formatter: '{b}: {c} 个任务' },
      grid: { left: 8, right: 8, top: 20, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: days,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: '#94a3b8' },
      },
      yAxis: {
        type: 'value' as const,
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { fontSize: 10, color: '#94a3b8' },
      },
      series: [
        {
          name: '完成任务',
          type: 'bar',
          barWidth: 18,
          data: counts.map((c, i) => ({
            value: c,
            itemStyle: { color: i === 6 ? BLUE : '#93b4e8', borderRadius: [2, 2, 0, 0] },
          })),
        },
      ],
    };
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* 类型分布 */}
      <div className="md:col-span-4">
        <div className="report-card p-6 h-full">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="section-label">Type Distribution</span>
          </div>
          <div className="section-subtitle mb-2">任务类型占比</div>
          {hasData ? (
            <ReactECharts option={typeOption} style={{ height: 220 }} notMerge lazyUpdate />
          ) : (
            <EmptyChart text="完成任务后展示类型分布" />
          )}
        </div>
      </div>

      {/* 难度分布 */}
      <div className="md:col-span-4">
        <div className="report-card p-6 h-full">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="section-label">Difficulty Mix</span>
          </div>
          <div className="section-subtitle mb-2">难度分布</div>
          {hasData ? (
            <ReactECharts option={difficultyOption} style={{ height: 220 }} notMerge lazyUpdate />
          ) : (
            <EmptyChart text="完成任务后展示难度分布" />
          )}
        </div>
      </div>

      {/* 近7天趋势 */}
      <div className="md:col-span-4">
        <div className="report-card p-6 h-full">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="section-label">7-Day Trend</span>
          </div>
          <div className="section-subtitle mb-2">近 7 天完成趋势</div>
          {hasData ? (
            <ReactECharts option={trendOption} style={{ height: 220 }} notMerge lazyUpdate />
          ) : (
            <EmptyChart text="完成任务后展示每日趋势" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
          NO DATA
        </div>
        <div className="text-[10px] text-slate-400">{text}</div>
      </div>
    </div>
  );
}
