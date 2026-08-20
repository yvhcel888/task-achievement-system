import { useEffect, useRef, useState } from 'react';

interface SubTabItem {
  id: string;
  label: string;
  emoji?: string;
}

/**
 * 通用子 Tab 条：横向滚动 + 溢出时显示左右箭头（点击滚动）+
 * 渐变遮罩提示更多内容。解决"看不到又翻不了"的问题。
 */
export default function SubTabBar({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: SubTabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // 内容渲染后尺寸可能变化，稍后重算
    const t = setTimeout(update, 120);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(t);
    };
  }, [tabs, active]);

  const scrollBy = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      {canL && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none" />
          <button
            onClick={() => scrollBy(-1)}
            aria-label="向左滚动"
            className="absolute left-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-[#0033a0] hover:bg-[#002580] text-white text-xs font-black flex items-center justify-center shadow-sm"
          >
            ‹
          </button>
        </>
      )}
      <div ref={ref} className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors bp-no-elevate ${
              active === t.id ? 'bg-[#0033a0] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {t.emoji && <span>{t.emoji}</span>}
            {t.label}
          </button>
        ))}
      </div>
      {canR && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none" />
          <button
            onClick={() => scrollBy(1)}
            aria-label="向右滚动"
            className="absolute right-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-[#0033a0] hover:bg-[#002580] text-white text-xs font-black flex items-center justify-center shadow-sm"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
