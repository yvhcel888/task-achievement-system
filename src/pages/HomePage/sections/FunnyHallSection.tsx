import { motion } from 'framer-motion';
import { Quote, Lightbulb, MessageCircle, Sparkles } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';
import { getDailyQuote, getFunnyIdentity } from '@/data/funny-achievements';

/**
 * 趣味吐槽墙：每日语录 + 今日人设 + 搞笑成就历史墙
 */
export default function FunnyHallSection() {
  const { progress } = useGame();
  const history = progress.funnyHistory ?? [];
  const identity = getFunnyIdentity(progress);
  const quote = getDailyQuote(progress);

  return (
    <div className="space-y-6">
      {/* 语录条 + 今日人设 */}
      <div className="report-card p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 shrink-0 bg-amber-50 text-amber-500 flex items-center justify-center">
            <Quote className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-500 mb-1">
              Daily Quote · 今日语录
            </div>
            <div className="text-sm font-bold text-slate-700 leading-relaxed">{quote}</div>
          </div>
        </div>

        <div className="shrink-0 md:ml-6 md:border-l md:border-slate-100 md:pl-6 flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#0033a0] to-[#2563eb] text-white flex items-center justify-center text-xl">
            {identity.emoji}
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-0.5">
              Today Persona · 今日人设
            </div>
            <div className="text-sm font-black text-slate-800">{identity.label}</div>
          </div>
        </div>
      </div>

      {/* 搞笑成就墙 */}
      {history.length === 0 ? (
        <div className="report-card p-8 flex flex-col items-center justify-center gap-2 text-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-4xl"
          >
            🤡
          </motion.div>
          <div className="text-xs font-bold text-slate-600 mt-2">
            吐槽墙空空如也
          </div>
          <div className="text-[11px] text-slate-400">
            完成第一个任务，系统就会根据任务内容给你颁发搞笑成就
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((entry, i) => (
            <motion.div
              key={`${entry.completedAt}-${entry.title}-${i}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.06, 0.6) }}
              className="report-card p-4 relative overflow-hidden group hover:-translate-y-0.5 transition-transform"
            >
              {/* 顶部色条 */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 opacity-60" />

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-xl">
                  {entry.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-black text-slate-800 leading-snug mb-0.5">
                    {entry.title}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {entry.comment}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 thin-border-t flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-orange-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-600 truncate">
                  {entry.taskName}
                </span>
                <span className="ml-auto text-[9px] font-mono text-slate-300 tabular-nums shrink-0">
                  {fmtTime(entry.completedAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 底部小提示 */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <Lightbulb className="w-3 h-3 text-amber-400" />
        成就名称根据任务内容、完成时段、连续天数自动生成，仅供娱乐，认真你就输了
        <MessageCircle className="w-3 h-3 text-amber-400 ml-2" />
        最多保留最近 20 条
      </div>
    </div>
  );
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
