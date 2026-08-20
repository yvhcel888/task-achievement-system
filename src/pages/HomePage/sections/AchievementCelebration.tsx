import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useGame } from '@/contexts/GameContext';
import { type IAchievement } from '@/data/achievements';

const rarityConfig: Record<
  string,
  { label: string; text: string; barColor: string; bgAccent: string; particleColors: string[] }
> = {
  common: {
    label: 'COMMON · 普通',
    text: '#64748B',
    barColor: '#94A3B8',
    bgAccent: '#F8FAFC',
    particleColors: ['#94A3B8', '#CBD5E1', '#64748B'],
  },
  rare: {
    label: 'RARE · 稀有',
    text: '#1D4ED8',
    barColor: '#3B82F6',
    bgAccent: '#EFF6FF',
    particleColors: ['#3B82F6', '#60A5FA', '#1D4ED8'],
  },
  epic: {
    label: 'EPIC · 史诗',
    text: '#6D28D9',
    barColor: '#8B5CF6',
    bgAccent: '#F5F3FF',
    particleColors: ['#8B5CF6', '#A78BFA', '#6D28D9'],
  },
  legendary: {
    label: 'LEGENDARY · 传说',
    text: '#B45309',
    barColor: '#F59E0B',
    bgAccent: '#FFFBEB',
    particleColors: ['#F59E0B', '#FBBF24', '#B45309', '#FEF3C7'],
  },
};

export default function AchievementCelebration() {
  const { pendingAchievements, isCelebrating, closeCelebration, clearPendingAchievement } = useGame();
  const current = pendingAchievements[0];

  const handleNext = () => {
    if (pendingAchievements.length > 1) {
      clearPendingAchievement();
    } else {
      closeCelebration();
    }
  };

  if (!isCelebrating) return null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="celebration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={handleNext}
        >
          <ParticleBurst colors={rarityConfig[current.rarity].particleColors} />

          <motion.div
            key={current.id}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 卡片主体 - 蓝图风：白色 + 顶部色条 */}
            <div className="relative bg-white shadow-2xl overflow-hidden">
              {/* 顶部色条 */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: rarityConfig[current.rarity].barColor }}
              />

              {/* 关闭按钮 */}
              <button
                onClick={closeCelebration}
                className="absolute top-3 right-3 w-7 h-7 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors z-20"
                aria-label="关闭"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* 顶部标签 */}
              <div className="pt-8 pb-4 px-6 text-center">
                <div
                  className="text-[9px] font-black uppercase tracking-[0.2em] inline-block px-2 py-0.5"
                  style={{
                    backgroundColor: rarityConfig[current.rarity].bgAccent,
                    color: rarityConfig[current.rarity].text,
                  }}
                >
                  <Award className="w-3 h-3 inline mr-1 -mt-0.5" />
                  ACHIEVEMENT UNLOCKED
                </div>
              </div>

              {/* 徽章展示区 */}
              <div className="px-6 pb-6">
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  {/* 旋转外环 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border border-dashed"
                    style={{ borderColor: rarityConfig[current.rarity].barColor }}
                  />

                  {/* 徽章主体 */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
                    className="relative z-10 w-20 h-20 flex flex-col items-center justify-center"
                    style={{ backgroundColor: rarityConfig[current.rarity].bgAccent }}
                  >
                    {/* 顶部色条 */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: rarityConfig[current.rarity].barColor }}
                    />
                    <span className="text-4xl">{current.icon}</span>
                  </motion.div>
                </div>
              </div>

              {/* 信息区 */}
              <div className="px-6 pb-5 text-center space-y-3 thin-border-t pt-5">
                <div
                  className="text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ color: rarityConfig[current.rarity].text }}
                >
                  {rarityConfig[current.rarity].label}
                </div>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-2xl font-black text-slate-800 tracking-tight"
                >
                  {current.name}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-xs text-slate-500 font-medium leading-relaxed"
                >
                  {current.description}
                </motion.p>

                {/* 积分奖励 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 }}
                  className="inline-flex items-center gap-2 px-4 py-2"
                  style={{ backgroundColor: rarityConfig[current.rarity].bgAccent }}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    奖励积分
                  </span>
                  <span
                    className="text-xl font-black tabular-nums"
                    style={{ color: rarityConfig[current.rarity].text }}
                  >
                    +{current.rewardPoints}
                  </span>
                </motion.div>
              </div>

              {/* 按钮区 */}
              <div className="px-6 pb-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <Button
                    size="lg"
                    onClick={handleNext}
                    className="w-full h-11 font-bold rounded-none shadow-none bg-[#0033a0] hover:bg-[#002580] bp-no-elevate"
                  >
                    {pendingAchievements.length > 1
                      ? `收下 (剩余 ${pendingAchievements.length - 1} 个)`
                      : '收下成就'}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* 多成就指示器 */}
            {pendingAchievements.length > 1 && (
              <div className="mt-4 flex justify-center gap-1.5">
                {pendingAchievements.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-6 ${
                      i === 0 ? 'bg-[#0033a0]' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ParticleBurst({ colors }: { colors: string[] }) {
  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      angle: (i / 24) * 360 + Math.random() * 15,
      distance: 80 + Math.random() * 140,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.2,
      duration: 1 + Math.random() * 0.7,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
    }));
  }, [colors]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const endX = Math.cos(rad) * p.distance;
        const endY = Math.sin(rad) * p.distance;

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: endX,
              y: endY,
              scale: [0, 1, 1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
            className="absolute left-1/2 top-1/2"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : 0,
            }}
          />
        );
      })}
    </div>
  );
}
