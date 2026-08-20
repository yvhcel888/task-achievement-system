import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BadgeCheck, ChevronDown, Medal } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';
import { getAvailableTitles, getTitleById } from '@/data/titles';

/**
 * 称号装备栏：展示当前装备称号，点击展开可选称号列表（动态解锁）
 */
export default function TitleEquipPanel() {
  const { tasks, progress, equippedTitle, setEquippedTitle } = useGame();
  const [open, setOpen] = useState(false);

  const available = useMemo(() => getAvailableTitles(progress, tasks), [progress, tasks]);
  const current = getTitleById(equippedTitle);

  const handleEquip = (id: string | null) => {
    setEquippedTitle(id);
    setOpen(false);
    const t = getTitleById(id);
    toast.success(t ? `已装备称号「${t.name}」` : '已卸下称号', {
      description: t ? `${t.emoji} ${t.desc}` : '你的称号栏空空如也',
    });
  };

  return (
    <div className="report-card p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0033a0] opacity-60" />

      <div className="flex items-center gap-4">
        {/* 当前装备 */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 shrink-0 bg-[#0033a0] text-white flex items-center justify-center text-lg">
            {current ? current.emoji : <Medal className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-0.5">
              Equipped Title · 装备称号
            </div>
            <div className="text-sm font-black text-slate-800 truncate">
              {current ? `${current.name}` : '未装备称号'}
            </div>
          </div>
        </div>

        {/* 已解锁统计 */}
        <div className="hidden sm:block text-right">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            已解锁
          </div>
          <div className="text-lg font-black text-[#0033a0] tabular-nums">
            {available.length}
            <span className="text-[10px] text-slate-400 font-bold"> / {13}</span>
          </div>
        </div>

        {/* 展开按钮 */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider transition-colors bp-no-elevate"
        >
          <BadgeCheck className="w-3.5 h-3.5" />
          更换称号
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 称号列表 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 thin-border-t grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                onClick={() => handleEquip(null)}
                className={`p-2.5 text-left border transition-colors bp-no-elevate ${
                  !current
                    ? 'border-[#0033a0] bg-[#0033a0]/5'
                    : 'border-slate-100 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-600">🚫 不装备</div>
                <div className="text-[9px] text-slate-400 mt-0.5">保持低调</div>
              </button>

              {available.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleEquip(t.id)}
                  className={`p-2.5 text-left border transition-colors bp-no-elevate ${
                    current?.id === t.id
                      ? 'border-[#0033a0] bg-[#0033a0]/5'
                      : 'border-slate-100 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-black text-slate-700">
                    {t.emoji} {t.name}
                    {current?.id === t.id && <span className="ml-1 text-[#0033a0]">✓</span>}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{t.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
