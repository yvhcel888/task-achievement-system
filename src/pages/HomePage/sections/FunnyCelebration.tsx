import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';

/**
 * 搞笑成就浮层：任务提交后右下角弹出（蓝图风轻量卡片），
 * 队列轮播展示（主成就 + 里程碑成就），每条 3.5s 自动消失，可手动关闭。
 * 与正式成就弹窗（z-50）互不干扰，浮层 z-40。
 */
export default function FunnyCelebration() {
  const { lastFunny, clearLastFunny } = useGame();
  const [index, setIndex] = useState(0);

  // 新队列到来时重置到第一条
  useEffect(() => {
    if (lastFunny.length > 0) setIndex(0);
  }, [lastFunny]);

  // 轮播 + 自动消失
  useEffect(() => {
    if (lastFunny.length === 0) return;
    if (index >= lastFunny.length) {
      clearLastFunny();
      return;
    }
    const timer = setTimeout(() => {
      if (index + 1 >= lastFunny.length) {
        clearLastFunny();
      } else {
        setIndex(index + 1);
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [lastFunny, index, clearLastFunny]);

  if (lastFunny.length === 0) return null;
  const current = lastFunny[index] ?? lastFunny[0];

  return (
    <AnimatePresence>
      <motion.div
        key={`funny-${current.completedAt}-${current.title}`}
        initial={{ opacity: 0, x: 60, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 80, transition: { duration: 0.25 } }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="fixed bottom-6 right-6 z-40 w-[320px] max-w-[calc(100vw-2rem)]"
      >
        <div className="relative bg-white shadow-2xl border border-slate-100 overflow-hidden">
          {/* 顶部渐变装饰条 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400" />

          {/* 关闭按钮 */}
          <button
            onClick={clearLastFunny}
            className="absolute top-2.5 right-2.5 w-6 h-6 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors z-10"
            aria-label="关闭"
          >
            <X className="w-3 h-3" />
          </button>

          <div className="px-5 pt-6 pb-5">
            {/* 标签 */}
            <div className="flex items-center gap-1.5 mb-3">
              <MessageCircle className="w-3 h-3 text-orange-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-500">
                Funny Achievement · 搞笑成就
              </span>
            </div>

            {/* 主体：emoji + 成就名 */}
            <div className="flex items-start gap-4">
              <motion.div
                key={`${current.title}-icon`}
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                className="w-14 h-14 shrink-0 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-3xl"
              >
                {current.emoji}
              </motion.div>
              <div className="min-w-0 flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="text-base font-black text-slate-800 leading-snug mb-1"
                >
                  {current.title}
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[11px] text-slate-500 leading-relaxed"
                >
                  {current.comment}
                </motion.p>
              </div>
            </div>

            {/* 底部：触发任务 */}
            <div className="mt-4 pt-3 thin-border-t flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
                触发任务
              </span>
              <span className="text-[11px] font-bold text-slate-600 truncate">
                {current.taskName}
              </span>
              {lastFunny.length > 1 && (
                <span className="ml-auto text-[9px] font-mono text-slate-300 tabular-nums">
                  {index + 1}/{lastFunny.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
