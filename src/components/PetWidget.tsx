import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LS_VISIBLE = 'petWidgetVisible';

/**
 * 悬浮桌宠(Webmeji 开源项目,Shimeji 风格):
 * 初音未来(Miku)精灵在页面底部行走/站立/坐下/跳舞/绊倒,
 * 可攀爬屏幕边缘悬挂,可拖拽,鼠标悬停互动。
 * 默认开启,所有页面可见(含登录页)。
 */
export default function PetWidget() {
  const [visible, setVisible] = useState(() => localStorage.getItem(LS_VISIBLE) !== '0');
  const [panel, setPanel] = useState(false);
  const loadedRef = useRef(false);

  // 响应设置面板开关
  useEffect(() => {
    const onChange = (e: Event) => setVisible((e as CustomEvent<boolean>).detail);
    window.addEventListener('pet-visible-change', onChange);
    return () => window.removeEventListener('pet-visible-change', onChange);
  }, []);

  // 注入 Webmeji(加载一次,路由切换不重复注入)
  useEffect(() => {
    if (!visible || loadedRef.current) return;
    loadedRef.current = true;
    const base = '/tools/webmeji/';
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + 'webmeji.css';
    document.head.appendChild(link);

    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.body.appendChild(s);
      });

    (async () => {
      await loadScript(base + 'config.js');
      await loadScript(base + 'webmeji.js');
    })();
  }, [visible]);

  const hidePet = () => {
    localStorage.setItem(LS_VISIBLE, '0');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Webmeji 注入的桌宠本体由脚本创建,这里只做设置浮层 */}

      {/* 右下角小按钮(设置入口) */}
      <button
        onClick={() => setPanel((v) => !v)}
        className="fixed z-[59] w-9 h-9 bg-white/85 backdrop-blur shadow-md thin-border text-[15px] flex items-center justify-center hover:bg-white bp-no-elevate"
        style={{ right: 14, bottom: 14 }}
        title="桌宠设置"
      >
        {panel ? '✕' : '⚙️'}
      </button>

      <AnimatePresence>
        {panel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed z-[61] w-56 bg-white/95 backdrop-blur shadow-2xl thin-border p-4"
            style={{ right: 14, bottom: 58 }}
          >
            <div className="text-[12px] font-black text-slate-800 mb-1">🎀 桌宠 · Miku</div>
            <div className="text-[9px] text-slate-400 leading-relaxed mb-3">
              基于开源项目 Webmeji(Shimeji 风格)——初音未来会在页面底部行走、跳舞、攀爬边缘,可以抓住她扔出去!
            </div>
            <div className="text-[9px] text-slate-400 leading-relaxed mb-3">
              💬 想和桌宠聊天?去顶部「桌宠」页开启 AI 对话(用你配置的 API)
            </div>
            <button
              onClick={hidePet}
              className="w-full h-8 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 text-[10px] font-black transition-colors bp-no-elevate"
            >
              🙈 隐藏桌宠
            </button>
            <div className="text-[8px] text-slate-300 mt-2 text-center">可在「桌宠」页重新开启</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
