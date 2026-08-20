import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, Sparkles, CalendarDays } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';
import { computePetState, PET_STAGE_LABELS } from '@/data/pet';
import { getFortune, getSpecialDay } from '@/data/fortune';

/**
 * 宠物 + 每日运势条：任务宠养成（纯推导）+ 当日运势 + 节日/星期彩蛋
 */
export default function PetFortuneBar() {
  const { tasks, progress } = useGame();

  const pet = useMemo(() => computePetState(progress, tasks), [progress, tasks]);
  const fortune = useMemo(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    return getFortune(dateStr, pet.fedToday, progress.totalTasks);
  }, [pet.fedToday, progress.totalTasks]);
  const special = useMemo(() => getSpecialDay(), []);

  const moodStyle =
    pet.mood === 'happy'
      ? { bg: 'bg-emerald-50', text: 'text-emerald-600', label: '心情:吃饱喝足' }
      : pet.mood === 'hungry'
        ? { bg: 'bg-amber-50', text: 'text-amber-600', label: pet.hungryDays >= 2 ? `已饿 ${pet.hungryDays} 天` : '肚子咕咕叫' }
        : pet.mood === 'critical'
          ? { bg: 'bg-red-50', text: 'text-red-600', label: '离家出走倒计时' }
          : { bg: 'bg-slate-50', text: 'text-slate-500', label: '等待孵化' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左：宠物卡片 */}
      <div className="lg:col-span-7">
        <div className="report-card p-5 md:p-6 h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-70" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* 宠物形象 */}
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <motion.div
                animate={pet.fedToday ? { y: [0, -6, 0] } : pet.mood === 'hungry' ? { rotate: [0, -3, 3, 0] } : {}}
                transition={{ duration: pet.fedToday ? 1.6 : 0.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-6xl shadow-inner"
              >
                {pet.emoji}
              </motion.div>
              {/* 等级徽章 */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#0033a0] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                Lv.{pet.level}
              </div>
            </div>

            {/* 宠物信息 */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <PawPrint className="w-3.5 h-3.5 text-teal-500" />
                <span className="section-label">Task Pet · 任务宠物</span>
              </div>
              <div className="text-xl font-black text-slate-800 mb-1">
                {pet.name}
                <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {PET_STAGE_LABELS[pet.stage]}期
                </span>
              </div>

              {/* 阶段进度 */}
              <div className="flex items-center gap-1.5 mb-3">
                {PET_STAGE_LABELS.map((label, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
                      i <= pet.stage ? 'text-teal-600' : 'text-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 ${i <= pet.stage ? 'bg-teal-500' : 'bg-slate-200'}`} />
                    {label}
                    {i < PET_STAGE_LABELS.length - 1 && <span className="text-slate-200">—</span>}
                  </div>
                ))}
              </div>

              <div className="text-[11px] font-bold text-slate-600 mb-1">“{pet.say}”</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold ${moodStyle.bg} ${moodStyle.text}`}>
                  {moodStyle.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{pet.progressText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右：每日运势 + 节日彩蛋 */}
      <div className="lg:col-span-5">
        <div className="report-card p-5 md:p-6 h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 opacity-70" />
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="section-label">Daily Fortune · 每日运势</span>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div
              className="w-14 h-14 flex flex-col items-center justify-center text-white"
              style={{ backgroundColor: fortune.rankColor }}
            >
              <span className="text-2xl leading-none">{fortune.rankEmoji}</span>
              <span className="text-[10px] font-black mt-0.5">{fortune.rank}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-600 leading-relaxed">{fortune.comment}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-emerald-50 p-3">
              <div className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1.5">今日宜 · Lucky</div>
              <div className="flex flex-wrap gap-1">
                {fortune.lucky.map((l) => (
                  <span key={l} className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 border border-emerald-100">
                    {pet.fedToday && fortune.lucky[0] === l ? '✓' : ''}{l}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-red-50 p-3">
              <div className="text-[9px] font-black uppercase tracking-wider text-red-500 mb-1.5">今日忌 · Unlucky</div>
              <div className="flex flex-wrap gap-1">
                {fortune.unlucky.map((u) => (
                  <span key={u} className="text-[10px] font-bold text-red-600 bg-white px-1.5 py-0.5 border border-red-100">
                    {u}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 节日/星期彩蛋 */}
          {special && (
            <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2">
              <span className="text-xl">{special.emoji}</span>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-2">
                  <CalendarDays className="w-3 h-3 inline -mt-0.5 mr-1" />
                  {special.title}
                </span>
                <span className="text-[11px] text-slate-500">{special.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
