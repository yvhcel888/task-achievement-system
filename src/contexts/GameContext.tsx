import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { logger } from '@lark-apaas/client-toolkit-lite';

import { useAuth } from '@/contexts/AuthContext';
import { MOCK_ACHIEVEMENTS, type IAchievement } from '@/data/achievements';
import { generateFunnyAchievement, generateMilestoneFunny } from '@/data/funny-achievements';
import {
  createInitialProgress,
  calcExpToNextLevel,
  DIFFICULTY_POINTS,
  type IFunnyEntry,
  type ITask,
  type IUserProgress,
  type TaskType,
  type TaskDifficulty,
} from '@/data/game';

interface GameContextValue {
  tasks: ITask[];
  progress: IUserProgress;
  unlockedAchievements: IAchievement[];
  pendingAchievements: IAchievement[];
  isCelebrating: boolean;
  lastGainedPoints: number;
  lastFunny: IFunnyEntry[];
  dataLoaded: boolean;
  addTask: (name: string, type: TaskType, difficulty: TaskDifficulty) => void;
  removeTask: (id: string) => void;
  clearPendingAchievement: () => void;
  closeCelebration: () => void;
  clearLastFunny: () => void;
  resetProgress: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  equippedTitle: string | null;
  setEquippedTitle: (id: string | null) => void;
  gameBest: (gameId: string) => number;
  setGameScore: (gameId: string, score: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayStr(): string {
  return fmtDate(Date.now());
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmtDate(d.getTime());
}

/** 根据任务列表重算连续天数（允许今天还没有任务、昨天有任务时连续不中断） */
function computeStreak(tasks: ITask[]): { streakDays: number; lastCompletedDate: string } {
  if (tasks.length === 0) return { streakDays: 0, lastCompletedDate: '' };

  const days = new Set(tasks.map((t) => fmtDate(t.completedAt)));

  let cursor = new Date();
  if (!days.has(fmtDate(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(fmtDate(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const latest = tasks.reduce((max, t) => Math.max(max, t.completedAt), 0);
  return { streakDays: streak, lastCompletedDate: fmtDate(latest) };
}

/** 从累计积分推导等级/经验（与 addTask 的升级逻辑一致） */
function computeLevelFromPoints(points: number): {
  level: number;
  currentExp: number;
  expToNextLevel: number;
} {
  let level = 1;
  let currentExp = points;
  let expToNextLevel = calcExpToNextLevel(level);
  let guard = 0;
  while (currentExp >= expToNextLevel && guard < 10000) {
    currentExp -= expToNextLevel;
    level += 1;
    expToNextLevel = calcExpToNextLevel(level);
    guard += 1;
  }
  return { level, currentExp, expToNextLevel };
}

function computeNewProgress(prev: IUserProgress, task: ITask): IUserProgress {
  const today = getTodayStr();
  let streakDays = prev.streakDays;

  if (prev.lastCompletedDate !== today) {
    if (prev.lastCompletedDate === getYesterdayStr() || prev.streakDays === 0) {
      streakDays = prev.streakDays + 1;
    } else if (prev.lastCompletedDate && prev.lastCompletedDate !== today) {
      streakDays = 1;
    }
  }

  const longestStreak = Math.max(prev.longestStreak, streakDays);

  // 单日任务数统计（跨天清零）
  const dailyTaskCount = prev.lastCompletedDate === today ? prev.dailyTaskCount + 1 : 1;
  const maxDailyTasks = Math.max(prev.maxDailyTasks, dailyTaskCount);

  const newTotalTasks = prev.totalTasks + 1;
  const newTaskCountsByType = {
    ...prev.taskCountsByType,
    [task.type]: prev.taskCountsByType[task.type] + 1,
  };
  const newTaskCountsByDifficulty = {
    ...prev.taskCountsByDifficulty,
    [task.difficulty]: prev.taskCountsByDifficulty[task.difficulty] + 1,
  };

  let totalPoints = prev.totalPoints + task.points;
  let currentExp = prev.currentExp + task.points;
  let level = prev.level;
  let expToNextLevel = prev.expToNextLevel;

  while (currentExp >= expToNextLevel) {
    currentExp -= expToNextLevel;
    level += 1;
    expToNextLevel = calcExpToNextLevel(level);
  }

  return {
    level,
    totalPoints,
    currentExp,
    expToNextLevel,
    unlockedAchievementIds: [...prev.unlockedAchievementIds],
    streakDays,
    lastCompletedDate: today,
    taskCountsByType: newTaskCountsByType,
    taskCountsByDifficulty: newTaskCountsByDifficulty,
    totalTasks: newTotalTasks,
    longestStreak,
    dailyTaskCount,
    maxDailyTasks,
    funnyHistory: [...(prev.funnyHistory ?? [])],
    equippedTitle: prev.equippedTitle ?? null,
    games: prev.games ?? {},
  };
}

/** 删除任务后基于剩余任务重算全部统计（成就保留为终身记录） */
function recomputeProgressFromTasks(tasks: ITask[], prev: IUserProgress): IUserProgress {
  const countsByType: Record<TaskType, number> = {
    study: 0,
    work: 0,
    sport: 0,
    life: 0,
    other: 0,
  };
  const countsByDifficulty: Record<TaskDifficulty, number> = { easy: 0, medium: 0, hard: 0 };

  let totalPoints = 0;
  for (const t of tasks) {
    countsByType[t.type] += 1;
    countsByDifficulty[t.difficulty] += 1;
    totalPoints += t.points;
  }

  const { streakDays, lastCompletedDate } = computeStreak(tasks);
  const { level, currentExp, expToNextLevel } = computeLevelFromPoints(totalPoints);

  // 单日任务数：按天统计，取历史最大值
  const perDay = new Map<string, number>();
  for (const t of tasks) {
    const day = fmtDate(t.completedAt);
    perDay.set(day, (perDay.get(day) || 0) + 1);
  }
  const todayStr = getTodayStr();
  const dailyTaskCount = perDay.get(todayStr) || 0;
  const maxDailyTasks = Math.max(prev.maxDailyTasks, ...perDay.values());

  return {
    level,
    totalPoints,
    currentExp,
    expToNextLevel,
    unlockedAchievementIds: [...prev.unlockedAchievementIds],
    streakDays,
    lastCompletedDate,
    taskCountsByType: countsByType,
    taskCountsByDifficulty: countsByDifficulty,
    totalTasks: tasks.length,
    longestStreak: Math.max(prev.longestStreak, streakDays),
    dailyTaskCount,
    maxDailyTasks,
    funnyHistory: [...(prev.funnyHistory ?? [])],
    equippedTitle: prev.equippedTitle ?? null,
    games: prev.games ?? {},
  };
}

function checkNewAchievements(progress: IUserProgress, tasks: ITask[]): IAchievement[] {
  const newOnes: IAchievement[] = [];

  for (const ach of MOCK_ACHIEVEMENTS) {
    if (progress.unlockedAchievementIds.includes(ach.id)) continue;

    let unlocked = false;
    const cond = ach.condition;

    switch (cond.type) {
      case 'totalTasks':
        unlocked = progress.totalTasks >= cond.target;
        break;
      case 'streakDays':
        unlocked = progress.streakDays >= cond.target;
        break;
      case 'difficultyCount':
        if (cond.difficulty) {
          unlocked =
            progress.taskCountsByDifficulty[cond.difficulty as TaskDifficulty] >=
            cond.target;
        }
        break;
      case 'typeCount':
        if (cond.taskType) {
          unlocked =
            progress.taskCountsByType[cond.taskType as TaskType] >= cond.target;
        }
        break;
      case 'totalPoints':
        unlocked = progress.totalPoints >= cond.target;
        break;
      case 'allTypes': {
        const allTypes: TaskType[] = ['study', 'work', 'sport', 'life'];
        unlocked = allTypes.every((t) => progress.taskCountsByType[t] >= cond.target);
        break;
      }
      case 'dailyTasks':
        unlocked = progress.maxDailyTasks >= cond.target;
        break;
      case 'nameMatch':
        if (cond.namePattern) {
          try {
            const re = new RegExp(cond.namePattern);
            unlocked = tasks.some((t) => re.test(t.name));
          } catch {
            unlocked = false;
          }
        }
        break;
    }

    if (unlocked) newOnes.push(ach);
  }

  return newOnes;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [progress, setProgress] = useState<IUserProgress>(() => createInitialProgress());
  const [pendingAchievements, setPendingAchievements] = useState<IAchievement[]>([]);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [lastGainedPoints, setLastGainedPoints] = useState(0);
  const [lastFunny, setLastFunny] = useState<IFunnyEntry[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const pointsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ tasks, progress });

  latestRef.current = { tasks, progress };

  // ---------- 登录后从服务器加载该用户数据 ----------
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setDataLoaded(true);
      return;
    }
    setDataLoaded(false);
    fetch('/api/data', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (String(res.message || '').includes('过期')) logout();
          return;
        }
        if (res.data) {
          if (Array.isArray(res.data.tasks)) setTasks(res.data.tasks);
          if (res.data.progress && typeof res.data.progress.level === 'number') {
            // 兼容旧数据：无 funnyHistory 字段时补默认值
            setProgress({
              ...createInitialProgress(),
              ...res.data.progress,
              funnyHistory: Array.isArray(res.data.progress.funnyHistory)
                ? res.data.progress.funnyHistory
                : [],
              equippedTitle:
                typeof res.data.progress.equippedTitle === 'string'
                  ? res.data.progress.equippedTitle
                  : null,
            });
          }
        }
      })
      .catch((error) => {
        logger.error('load server data failed:', String(error));
      })
      .finally(() => {
        if (!cancelled) setDataLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  // ---------- 数据变更后防抖保存到服务器（400ms） ----------
  useEffect(() => {
    if (!dataLoaded || !token) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const { tasks: t, progress: p } = latestRef.current;
      fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks: t, progress: p }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (!res.ok && String(res.message || '').includes('过期')) logout();
        })
        .catch(() => {});
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [tasks, progress, dataLoaded, token, logout]);

  // ---------- 卸载前 flush 最后一次保存 ----------
  useEffect(() => {
    return () => {
      if (pointsTimerRef.current) clearTimeout(pointsTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const { tasks: t, progress: p } = latestRef.current;
      if (token && dataLoaded && (t.length > 0 || p.totalPoints > 0)) {
        fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tasks: t, progress: p }),
        }).catch(() => {});
      }
    };
  }, []);

  const flashPoints = useCallback((points: number) => {
    setLastGainedPoints(points);
    if (pointsTimerRef.current) clearTimeout(pointsTimerRef.current);
    pointsTimerRef.current = setTimeout(() => setLastGainedPoints(0), 1500);
  }, []);

  const addTask = useCallback(
    (name: string, type: TaskType, difficulty: TaskDifficulty) => {
      const points = DIFFICULTY_POINTS[difficulty];
      const task: ITask = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        type,
        difficulty,
        points,
        completedAt: Date.now(),
      };

      const newTasks = [task, ...latestRef.current.tasks];
      setTasks(newTasks);

      // ---------- 搞笑成就生成（基于最新进度预测，允许微小误差） ----------
      const base = latestRef.current.progress;
      const guess = computeNewProgress(base, task);
      const funnyCtx = {
        totalTasks: guess.totalTasks,
        streakDays: guess.streakDays,
        dailyTaskCount: guess.dailyTaskCount,
      };
      const main = generateFunnyAchievement(task, funnyCtx);
      const milestones = generateMilestoneFunny(funnyCtx);
      const funnyQueue: IFunnyEntry[] = [main, ...milestones].map((f) => ({
        title: f.title,
        comment: f.comment,
        emoji: f.emoji,
        taskName: name,
        completedAt: task.completedAt,
      }));
      setLastFunny(funnyQueue);

      setProgress((prevProgress) => {
        const next = computeNewProgress(prevProgress, task);
        // 搞笑成就历史（新条目在前，最多保留 20 条）
        next.funnyHistory = [...funnyQueue, ...(prevProgress.funnyHistory ?? [])].slice(0, 20);
        const newlyUnlocked = checkNewAchievements(next, newTasks);

        if (newlyUnlocked.length > 0) {
          next.unlockedAchievementIds = [
            ...next.unlockedAchievementIds,
            ...newlyUnlocked.map((a) => a.id),
          ];
          // 成就奖励积分
          const bonus = newlyUnlocked.reduce((sum, a) => sum + a.rewardPoints, 0);
          next.totalPoints += bonus;
          next.currentExp += bonus;

          while (next.currentExp >= next.expToNextLevel) {
            next.currentExp -= next.expToNextLevel;
            next.level += 1;
            next.expToNextLevel = calcExpToNextLevel(next.level);
          }

          setPendingAchievements(newlyUnlocked);
          setIsCelebrating(true);
        }

        return next;
      });

      flashPoints(points);
    },
    [flashPoints],
  );

  const removeTask = useCallback((id: string) => {
    setTasks((prevTasks) => {
      const nextTasks = prevTasks.filter((t) => t.id !== id);
      if (nextTasks.length === prevTasks.length) return prevTasks;
      setProgress((prevProgress) => recomputeProgressFromTasks(nextTasks, prevProgress));
      return nextTasks;
    });
  }, []);

  const clearPendingAchievement = useCallback(() => {
    setPendingAchievements((prev) => prev.slice(1));
  }, []);

  const closeCelebration = useCallback(() => {
    setIsCelebrating(false);
    setPendingAchievements([]);
  }, []);

  const clearLastFunny = useCallback(() => {
    setLastFunny([]);
  }, []);

  const setEquippedTitle = useCallback((id: string | null) => {
    setProgress((prev) => ({ ...prev, equippedTitle: id }));
  }, []);

  const gameBest = useCallback(
    (gameId: string) => progress.games?.[gameId] ?? 0,
    [progress.games],
  );

  const setGameScore = useCallback((gameId: string, score: number) => {
    setProgress((prev) => {
      const games = { ...(prev.games ?? {}) };
      if (score <= (games[gameId] ?? 0)) return prev;
      games[gameId] = Math.floor(score);
      return { ...prev, games };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setTasks([]);
    setProgress(createInitialProgress());
    setPendingAchievements([]);
    setIsCelebrating(false);
    setLastFunny([]);
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify(
      {
        app: 'task-achievement-system',
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks,
        progress,
      },
      null,
      2,
    );
  }, [tasks, progress]);

  const importData = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json) as {
        tasks?: ITask[];
        progress?: IUserProgress;
      };
      if (!data || !Array.isArray(data.tasks) || !data.progress) return false;

      const validTasks = data.tasks.filter(
        (t) =>
          t &&
          typeof t.id === 'string' &&
          typeof t.name === 'string' &&
          typeof t.points === 'number' &&
          typeof t.completedAt === 'number' &&
          ['study', 'work', 'sport', 'life', 'other'].includes(t.type) &&
          ['easy', 'medium', 'hard'].includes(t.difficulty),
      );
      const importedProgress = data.progress as IUserProgress;
      if (typeof importedProgress.level !== 'number') return false;

      setTasks(validTasks);
      setProgress(recomputeProgressFromTasks(validTasks, importedProgress));
      setPendingAchievements([]);
      setIsCelebrating(false);
      setLastFunny([]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const unlockedAchievements = useMemo(() => {
    return MOCK_ACHIEVEMENTS.filter((a) =>
      progress.unlockedAchievementIds.includes(a.id),
    );
  }, [progress.unlockedAchievementIds]);

  const value: GameContextValue = {
    tasks,
    progress,
    unlockedAchievements,
    pendingAchievements,
    isCelebrating,
    lastGainedPoints,
    lastFunny,
    dataLoaded,
    addTask,
    removeTask,
    clearPendingAchievement,
    closeCelebration,
    clearLastFunny,
    resetProgress,
    exportData,
    importData,
    equippedTitle: progress.equippedTitle ?? null,
    setEquippedTitle,
    gameBest,
    setGameScore,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider');
  }
  return ctx;
}
