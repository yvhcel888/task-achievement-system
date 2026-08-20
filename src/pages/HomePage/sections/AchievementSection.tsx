import { useState, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Zap, Target, Award, TrendingUp, BarChart3, Calendar } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useGame } from '@/contexts/GameContext';
import { MOCK_ACHIEVEMENTS, type IAchievement } from '@/data/achievements';

const rarityConfig: Record<string, { bar: string; label: string; text: string; bgLight: string }> = {
  common: { bar: '#94A3B8', label: '普通', text: '#64748B', bgLight: '#F8FAFC' },
  rare: { bar: '#3B82F6', label: '稀有', text: '#1D4ED8', bgLight: '#EFF6FF' },
  epic: { bar: '#8B5CF6', label: '史诗', text: '#6D28D9', bgLight: '#F5F3FF' },
  legendary: { bar: '#F59E0B', label: '传说', text: '#B45309', bgLight: '#FFFBEB' },
};

const categoryTabs = [
  { value: 'all', label: '全部', code: 'ALL', icon: Trophy },
  { value: 'basic', label: '基础', code: 'BSC', icon: Star },
  { value: 'quantity', label: '数量', code: 'QTY', icon: Target },
  { value: 'streak', label: '连续', code: 'STK', icon: Flame },
  { value: 'difficulty', label: '难度', code: 'DIF', icon: Zap },
  { value: 'type', label: '类型', code: 'TYP', icon: Award },
];

export default function AchievementSection() {
  const { progress, unlockedAchievements } = useGame();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return MOCK_ACHIEVEMENTS;
    return MOCK_ACHIEVEMENTS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const unlockedCount = unlockedAchievements.length;
  const totalCount = MOCK_ACHIEVEMENTS.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  // 进度追踪项
  const progressItems = useMemo(() => {
    const items: { id: string; name: string; icon: string; current: number; target: number; percent: number; rarity: string }[] = [];

    const quantityAchievements = MOCK_ACHIEVEMENTS
      .filter((a) => a.condition.type === 'totalTasks')
      .sort((a, b) => a.condition.target - b.condition.target);
    const nextQuantity = quantityAchievements.find(
      (a) => progress.totalTasks < a.condition.target,
    );
    if (nextQuantity) {
      items.push({
        id: nextQuantity.id,
        name: nextQuantity.name,
        icon: nextQuantity.icon,
        current: progress.totalTasks,
        target: nextQuantity.condition.target,
        percent: Math.min(100, (progress.totalTasks / nextQuantity.condition.target) * 100),
        rarity: nextQuantity.rarity,
      });
    }

    const streakAchievements = MOCK_ACHIEVEMENTS
      .filter((a) => a.condition.type === 'streakDays')
      .sort((a, b) => a.condition.target - b.condition.target);
    const nextStreak = streakAchievements.find(
      (a) => progress.streakDays < a.condition.target,
    );
    if (nextStreak) {
      items.push({
        id: nextStreak.id,
        name: nextStreak.name,
        icon: nextStreak.icon,
        current: progress.streakDays,
        target: nextStreak.condition.target,
        percent: Math.min(100, (progress.streakDays / nextStreak.condition.target) * 100),
        rarity: nextStreak.rarity,
      });
    }

    const hardAchievements = MOCK_ACHIEVEMENTS
      .filter((a) => a.condition.type === 'difficultyCount' && a.condition.difficulty === 'hard')
      .sort((a, b) => a.condition.target - b.condition.target);
    const nextHard = hardAchievements.find(
      (a) => (progress.taskCountsByDifficulty.hard || 0) < a.condition.target,
    );
    if (nextHard) {
      const current = progress.taskCountsByDifficulty.hard || 0;
      items.push({
        id: nextHard.id,
        name: nextHard.name,
        icon: nextHard.icon,
        current,
        target: nextHard.condition.target,
        percent: Math.min(100, (current / nextHard.condition.target) * 100),
        rarity: nextHard.rarity,
      });
    }

    return items;
  }, [progress]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 左：成就徽章网格 + 分类筛选 */}
      <div className="lg:col-span-8">
        <div className="report-card p-6">
          {/* Header + Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
            <div>
              <div className="section-label mb-1">Badge Collection</div>
              <div className="section-subtitle">
                已解锁 <span className="font-bold text-[#0033a0]">{unlockedCount}</span> / {totalCount} 枚 · 完成度 {progressPercent}%
              </div>
            </div>

            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="h-7 p-0.5 bg-slate-100 rounded-none">
                {categoryTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-[9px] font-black uppercase px-2.5 py-1 data-[state=active]:text-white data-[state=active]:bg-[#0033a0] rounded-none tracking-wider"
                  >
                    {tab.code}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* 总进度条 */}
          <div className="mb-5">
            <div className="h-1 bg-slate-100 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-[#0033a0]"
              />
            </div>
          </div>

          {/* 徽章网格 */}
          <TooltipProvider delayDuration={150}>
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-px bg-slate-100 border border-slate-100"
            >
              {filteredAchievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </motion.div>
          </TooltipProvider>
        </div>
      </div>

      {/* 右：进度追踪 + 数据统计 */}
      <div className="lg:col-span-4 space-y-6">
        {/* 进度追踪 */}
        <div className="report-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="section-label">Progress Track</span>
          </div>
          <div className="space-y-4">
            {progressItems.length > 0 ? (
              progressItems.map((item) => {
                const colors = rarityConfig[item.rarity];
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 tabular-nums shrink-0 ml-2">
                        {item.current}/{item.target}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-100 relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        className="absolute inset-y-0 left-0"
                        style={{ backgroundColor: colors.bar }}
                      />
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-tight" style={{ color: colors.text }}>
                      {colors.label} 级成就
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  所有进度成就已解锁
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 数据统计 */}
        <div className="report-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="section-label">Statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-0 border thin-border">
            <StatCell icon={<Target className="w-3 h-3" />} label="总任务数" value={progress.totalTasks.toString()} />
            <StatCell icon={<Award className="w-3 h-3" />} label="成就数" value={unlockedCount.toString()} />
            <StatCell icon={<Flame className="w-3 h-3" />} label="当前连续" value={`${progress.streakDays}d`} />
            <StatCell icon={<Calendar className="w-3 h-3" />} label="最长连续" value={`${progress.longestStreak}d`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 thin-border-r last:thin-border-r-0 thin-border-b last-row:thin-border-b-0">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[#0033a0]">{icon}</span>
        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-lg font-bold text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: IAchievement }) {
  const { progress } = useGame();
  const isUnlocked = progress.unlockedAchievementIds.includes(achievement.id);
  const colors = rarityConfig[achievement.rarity];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={`relative bg-white p-3 flex flex-col items-center gap-1 transition-all ${
            isUnlocked ? '' : 'opacity-40 grayscale'
          }`}
        >
          {/* 顶部色条 */}
          {isUnlocked && (
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: colors.bar }}
            />
          )}

          <div
            className={`w-10 h-10 flex items-center justify-center text-xl ${
              isUnlocked ? '' : 'grayscale'
            }`}
            style={{ backgroundColor: isUnlocked ? colors.bgLight : '#F1F5F9' }}
          >
            {achievement.icon}
          </div>

          <span className="text-[10px] font-bold text-slate-700 text-center leading-tight truncate w-full">
            {achievement.name}
          </span>

          <span
            className="text-[8px] font-black uppercase tracking-wider"
            style={{ color: isUnlocked ? colors.text : '#CBD5E1' }}
          >
            {colors.label}
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] p-3 rounded-none border-slate-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{achievement.icon}</span>
            <div>
              <div className="text-xs font-bold text-slate-800">{achievement.name}</div>
              <div
                className="text-[9px] font-black uppercase tracking-wider"
                style={{ color: colors.text }}
              >
                {colors.label}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">{achievement.description}</div>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="font-bold text-[#0033a0]">+{achievement.rewardPoints}</span>
            <span className="text-slate-400">积分奖励</span>
          </div>
          <div className="text-[9px] text-slate-400">
            状态: {isUnlocked ? '已解锁 ✓' : '未解锁'}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
