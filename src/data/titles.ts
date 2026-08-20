// 称号装备系统：基于统计数据动态解锁称号，可装备展示
import { type ITask, type IUserProgress, type TaskType } from './game';

export interface ITitle {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  test: (p: IUserProgress, tasks?: ITask[]) => boolean;
}

export const TITLES: ITitle[] = [
  {
    id: 'meng-xin',
    emoji: '🎒',
    name: '新手村村民',
    desc: '完成任务数少于 5 个',
    test: (p) => p.totalTasks < 5,
  },
  {
    id: 'shou-sha',
    emoji: '🎯',
    name: '首杀者',
    desc: '完成至少 1 个任务',
    test: (p) => p.totalTasks >= 1,
  },
  {
    id: 'night-owl',
    emoji: '🦉',
    name: '夜猫子',
    desc: '深夜(22-5点)完成任务 3 个以上',
    test: (_p, tasks) => countByHour(tasks ?? [], (h) => h >= 22 || h < 5) >= 3,
  },
  {
    id: 'early-bird',
    emoji: '🐦',
    name: '早起鸟',
    desc: '清晨(5-8点)完成任务 3 个以上',
    test: (_p, tasks) => countByHour(tasks ?? [], (h) => h >= 5 && h < 8) >= 3,
  },
  {
    id: 'juan-wang',
    emoji: '⚡',
    name: '效率卷王',
    desc: '单日完成 5 个任务以上',
    test: (p) => p.maxDailyTasks >= 5,
  },
  {
    id: 'gan-di',
    emoji: '👑',
    name: '肝帝',
    desc: '累计完成 50 个任务',
    test: (p) => p.totalTasks >= 50,
  },
  {
    id: 'xue-ba',
    emoji: '📚',
    name: '学霸',
    desc: '完成 10 个学习类任务',
    test: (p) => p.taskCountsByType.study >= 10,
  },
  {
    id: 'da-gong-ren',
    emoji: '💼',
    name: '打工人',
    desc: '完成 10 个工作类任务',
    test: (p) => p.taskCountsByType.work >= 10,
  },
  {
    id: 'yun-dong',
    emoji: '🏃',
    name: '运动达人',
    desc: '完成 10 个运动类任务',
    test: (p) => p.taskCountsByType.sport >= 10,
  },
  {
    id: 'sheng-huo',
    emoji: '🧹',
    name: '生活家',
    desc: '完成 10 个生活类任务',
    test: (p) => p.taskCountsByType.life >= 10,
  },
  {
    id: 'xie-jiao',
    emoji: '🌈',
    name: '斜杠青年',
    desc: '三种类型任务各完成 5 个以上',
    test: (p) => {
      const types: TaskType[] = ['study', 'work', 'sport', 'life'];
      return types.filter((t) => p.taskCountsByType[t] >= 5).length >= 3;
    },
  },
  {
    id: 'tie-ren',
    emoji: '🛡️',
    name: '铁人',
    desc: '最长连续打卡 7 天',
    test: (p) => p.longestStreak >= 7,
  },
  {
    id: 'ji-fen-da-lao',
    emoji: '💎',
    name: '积分大佬',
    desc: '累计积分达到 1000',
    test: (p) => p.totalPoints >= 1000,
  },
];

function countByHour(tasks: ITask[], fn: (h: number) => boolean): number {
  return tasks.filter((t) => fn(new Date(t.completedAt).getHours())).length;
}

export function getTitleById(id: string | null | undefined): ITitle | null {
  if (!id) return null;
  return TITLES.find((t) => t.id === id) ?? null;
}

export function getAvailableTitles(progress: IUserProgress, tasks: ITask[]): ITitle[] {
  return TITLES.filter((t) => t.test(progress, tasks));
}
