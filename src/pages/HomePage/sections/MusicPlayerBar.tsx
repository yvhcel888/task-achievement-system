import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';

import { useMusicPlayer, fmtTime } from '@/contexts/MusicContext';

/** 底部全局播放条：播放/暂停/进度拖动/音量/关闭 */
export default function MusicPlayerBar() {
  const { current, playing, progress, duration, volume, toggle, seek, setVolume, stop } = useMusicPlayer();

  if (!current) return null;

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#0033a0] shadow-[0_-4px_16px_rgba(0,51,160,0.08)]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-3 md:gap-5">
          {/* 歌曲信息 */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 md:flex-none md:w-64">
            <div className="w-9 h-9 bg-[#0033a0]/10 text-[#0033a0] flex items-center justify-center shrink-0">
              <Music2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-black text-slate-800 truncate">{current.title}</div>
              <div className="text-[10px] text-slate-400 truncate">{current.artist}</div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => seek(Math.max(0, progress - 10))} className="p-1.5 text-slate-400 hover:text-[#0033a0] transition-colors" title="后退10秒">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={toggle}
              className="w-9 h-9 bg-[#0033a0] hover:bg-[#002580] text-white flex items-center justify-center transition-colors"
              title={playing ? '暂停' : '播放'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={() => seek(Math.min(duration || 0, progress + 10))} className="p-1.5 text-slate-400 hover:text-[#0033a0] transition-colors" title="前进10秒">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* 进度条 */}
          <div className="hidden sm:flex items-center gap-2 flex-1">
            <span className="text-[10px] font-mono text-slate-400 tabular-nums w-9 text-right">
              {fmtTime(progress)}
            </span>
            <div
              className="relative flex-1 h-1 bg-slate-100 cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                seek(ratio * (duration || 0));
              }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#0033a0] group-hover:bg-[#002580] transition-colors"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums w-9">{fmtTime(duration)}</span>
          </div>

          {/* 音量 + 关闭 */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => setVolume(volume > 0 ? 0 : 0.8)} className="text-slate-400 hover:text-[#0033a0] transition-colors">
              {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 accent-[#0033a0]"
            />
          </div>
          <button onClick={stop} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="关闭">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
