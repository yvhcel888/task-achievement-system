// EXPORTS: ITask, IUserProgress, TASK_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_POINTS, getLevelTitle, calcExpToNextLevel, createInitialProgress

export type TaskType = 'study' | 'work' | 'sport' | 'life' | 'other';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';

export interface ITask {
  id: string;
  name: string;
  type: TaskType;
  difficulty: TaskDifficulty;
  points: number;
  completedAt: number;
}

/** 搞笑成就记录（完成任务时根据任务内容生成的幽默称号） */
export interface IFunnyEntry {
  title: string; // 搞笑成就名
  comment: string; // 吐槽/夸奖文案
  emoji: string;
  taskName: string; // 触发它的任务名
  completedAt: number;
}

export interface IUserProgress {
  level: number;
  totalPoints: number;
  currentExp: number;
  expToNextLevel: number;
  unlockedAchievementIds: string[];
  streakDays: number;
  lastCompletedDate: string; // YYYY-MM-DD
  taskCountsByType: Record<TaskType, number>;
  taskCountsByDifficulty: Record<TaskDifficulty, number>;
  totalTasks: number;
  longestStreak: number;
  dailyTaskCount: number;
  maxDailyTasks: number;
  funnyHistory: IFunnyEntry[]; // 最近搞笑成就（最多 20 条）
  equippedTitle: string | null; // 当前装备的称号 id
  games: Record<string, number>; // 小游戏最高分 {gameId: bestScore}
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  study: '学习',
  work: '工作',
  sport: '运动',
  life: '生活',
  other: '其他',
};

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  study: '📚',
  work: '💼',
  sport: '🏃',
  life: '🏠',
  other: '✨',
};

export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const DIFFICULTY_POINTS: Record<TaskDifficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

export function calcExpToNextLevel(level: number): number {
  return level * 100;
}

export function getLevelTitle(level: number): string {
  if (level >= 30) return '传奇勇者';
  if (level >= 20) return '大师级冒险者';
  if (level >= 15) return '资深任务猎人';
  if (level >= 10) return '任务达人';
  if (level >= 5) return '熟练冒险者';
  if (level >= 3) return '初级冒险者';
  return '新手冒险者';
}

export function createInitialProgress(): IUserProgress {
  return {
    level: 1,
    totalPoints: 0,
    currentExp: 0,
    expToNextLevel: calcExpToNextLevel(1),
    unlockedAchievementIds: [],
    streakDays: 0,
    lastCompletedDate: '',
    taskCountsByType: { study: 0, work: 0, sport: 0, life: 0, other: 0 },
    taskCountsByDifficulty: { easy: 0, medium: 0, hard: 0 },
    totalTasks: 0,
    longestStreak: 0,
    dailyTaskCount: 0,
    maxDailyTasks: 0,
    funnyHistory: [],
    equippedTitle: null,
    games: {},
  };
}
