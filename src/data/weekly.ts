// 本周战绩：按自然周（周一起）统计任务，生成幽默总结
import { type ITask, type TaskType, TASK_TYPE_LABELS } from './game';

export interface IWeeklyReport {
  count: number;
  points: number;
  nightCount: number; // 22-5 点完成的任务
  morningCount: number; // 5-8 点
  topType: TaskType | null;
  topTypeCount: number;
  comment: string;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function getWeeklyReport(tasks: ITask[]): IWeeklyReport {
  const now = new Date();
  const day = now.getDay() || 7; // 1-7, 周一=1
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1));
  const mondayTs = monday.getTime();

  // 本周 = 周一 00:00 至今
  const week = tasks.filter((t) => t.completedAt >= mondayTs);
  const count = week.length;
  const points = week.reduce((s, t) => s + t.points, 0);

  let nightCount = 0;
  let morningCount = 0;
  const typeCount: Record<TaskType, number> = { study: 0, work: 0, sport: 0, life: 0, other: 0 };
  for (const t of week) {
    const h = new Date(t.completedAt).getHours();
    if (h >= 22 || h < 5) nightCount += 1;
    else if (h >= 5 && h < 8) morningCount += 1;
    typeCount[t.type] += 1;
  }
  const sorted = (Object.entries(typeCount) as [TaskType, number][]).sort((a, b) => b[1] - a[1]);
  const topType = sorted[0][1] > 0 ? sorted[0][0] : null;
  const topTypeCount = topType ? typeCount[topType] : 0;

  let comment: string;
  if (count === 0) {
    comment = '本周还没开张…再摸下去，下周的任务会加倍讨债的。';
  } else if (count < 5) {
    comment = `本周完成 ${count} 个任务，效率堪忧，但至少没躺平，值得口头表扬。`;
  } else if (count <= 14) {
    comment = `本周 ${count} 个任务、${points} 积分，稳定输出，是个干大事的苗子。`;
  } else {
    comment = `本周 ${count} 个任务？！你是生产队的驴吧（纯夸奖）。`;
  }
  if (nightCount >= 5) {
    comment += ` 其中 ${nightCount} 个在深夜完成，建议和月亮商量一下作息。`;
  } else if (morningCount >= 3) {
    comment += ` 其中 ${morningCount} 个在清晨完成，早起的鸟儿有虫吃，诚不欺我。`;
  }
  if (topType && topTypeCount >= 5) {
    comment += ` ${TASK_TYPE_LABELS[topType]}类占了大头（${topTypeCount} 个），看来你的灵魂属于它。`;
  }

  return { count, points, nightCount, morningCount, topType, topTypeCount, comment };
}

export function fmtWeekRange(): string {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${monday.getMonth() + 1}/${pad(monday.getDate())} - ${now.getMonth() + 1}/${pad(now.getDate())}`;
}
