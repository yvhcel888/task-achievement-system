import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ThreeModelViewer from '@/components/ThreeModelViewer';

interface Skin { name: string; file: string }
interface Prop { name: string; file: string }
interface Character { name: string; skins: Skin[]; props: Prop[] }
interface Weapon { name: string; file: string; owner: string }
interface ModelData { characters: Character[]; weapons: Weapon[] }

// 绝区零角色 emoji 映射(展示用)
const EMOJI: Record<string, string> = {
  薇薇安: '🦋', 绳匠: '🎧', 蕾米埃尔: '💃', 仪玄: '🦅', 佩洛伊斯: '⚔️',
  千夏: '📢', 南宫羽: '🗡️', 叶瞬光: '⚡', 安比: '🥷', 浮波柚叶: '🍂',
  维琳娜: '🎹', 耀嘉音: '🎤', 诺姆: '🐻', '零号·安比': '🤖',
};

export default function ModelSection() {
  const [data, setData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Character | null>(null);
  const [skinIdx, setSkinIdx] = useState(0);
  const [viewWeapon, setViewWeapon] = useState<Weapon | null>(null);
  const [viewProp, setViewProp] = useState<Prop | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/models/models.json')
      .then((r) => r.json())
      .then((d: ModelData) => setData(d))
      .catch(() => setErr('模型数据加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const currentSkin = useMemo(
    () => (selected && selected.skins.length > 0 ? selected.skins[Math.min(skinIdx, selected.skins.length - 1)] : null),
    [selected, skinIdx],
  );

  if (loading) {
    return (
      <div className="report-card p-10 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#0033a0] inline mr-2" />
        <span className="text-[12px] text-slate-400">模型库加载中...</span>
      </div>
    );
  }
  if (err || !data) {
    return <div className="report-card p-6 text-red-500 text-[12px]">⚠️ {err || '数据为空'}</div>;
  }

  const viewUrl = viewWeapon ? `/models/${viewWeapon.file}` : viewProp ? `/models/${viewProp.file}` : currentSkin ? `/models/${currentSkin.file}` : '';

  return (
    <div className="space-y-8">
      {/* ============ 角色库 ============ */}
      <div className="report-card p-6">
        <div className="section-label mb-1">🎭 角色模型库</div>
        <div className="section-subtitle mb-4">绝区零角色 · 共 {data.characters.length} 位 · 点击查看皮肤与武器</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {data.characters.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setSelected(c);
                setSkinIdx(0);
                setViewWeapon(null);
                setViewProp(null);
              }}
              className={`p-4 border thin-border text-center transition-all bp-no-elevate hover:-translate-y-0.5 ${
                selected?.name === c.name ? 'bg-[#0033a0]/5 border-[#0033a0]' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="text-3xl mb-1.5">{EMOJI[c.name] || '🧊'}</div>
              <div className="text-[12px] font-black text-slate-800">{c.name}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {c.skins.length} 皮肤{c.props.length > 0 ? ` · ${c.props.length} 道具` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ============ 预览区 ============ */}
      {(selected || viewWeapon) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="report-card p-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-[14px] font-black text-slate-800">
              {viewWeapon ? `🔫 ${viewWeapon.name}` : viewProp ? `🎒 ${selected?.name} · ${viewProp.name}` : `🎭 ${selected?.name}`}
            </span>
            {viewWeapon && <span className="text-[9px] text-slate-400">来自 {viewWeapon.owner}</span>}
            <button
              onClick={() => {
                setSelected(null);
                setViewWeapon(null);
                setViewProp(null);
                setSkinIdx(0);
              }}
              className="ml-auto text-[10px] font-black text-slate-400 hover:text-[#0033a0]"
            >
              ✕ 关闭预览
            </button>
          </div>

          {/* 皮肤切换 */}
          {selected && !viewWeapon && !viewProp && selected.skins.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.skins.map((s, i) => (
                <button
                  key={s.file}
                  onClick={() => setSkinIdx(i)}
                  className={`px-3 py-1.5 text-[10px] font-black transition-colors bp-no-elevate ${
                    i === skinIdx ? 'bg-[#0033a0] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* 3D 预览(three.js 自渲染:防小mesh消失 + 位置调节) */}
          <div className="border thin-border bg-slate-900 overflow-hidden">
            <ThreeModelViewer src={viewUrl} resetKey={viewUrl} />
          </div>

          {/* 武器/道具 Tab */}
          {selected && !viewWeapon && !viewProp && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => { setViewProp(null); setSkinIdx(skinIdx); }}
                className="px-3 py-1.5 bg-[#0033a0]/10 text-[#0033a0] text-[10px] font-black"
              >
                🎭 角色
              </button>
              {selected.props.length > 0 && (
                <button
                  onClick={() => { setViewProp(selected.props[0]); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black"
                >
                  🎒 道具 ({selected.props.length})
                </button>
              )}
            </div>
          )}
          {selected && viewProp && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setViewProp(null)}
                className="px-3 py-1.5 bg-[#0033a0]/10 text-[#0033a0] text-[10px] font-black"
              >
                ← 返回角色
              </button>
              {selected.props.map((p) => (
                <button
                  key={p.file}
                  onClick={() => setViewProp(p)}
                  className={`px-3 py-1.5 text-[10px] font-black bp-no-elevate ${viewProp.file === p.file ? 'bg-[#0033a0] text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ============ 武器库 ============ */}
      <div className="report-card p-6">
        <div className="section-label mb-1">🔫 武器库</div>
        <div className="section-subtitle mb-4">角色独立武器 · 共 {data.weapons.length} 件 · 点击预览</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {data.weapons.map((w) => (
            <button
              key={w.file}
              onClick={() => {
                setViewWeapon(w);
                setSelected(null);
                setViewProp(null);
              }}
              className={`p-4 border thin-border text-center transition-all bp-no-elevate hover:-translate-y-0.5 ${
                viewWeapon?.file === w.file ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="text-3xl mb-1.5">🗡️</div>
              <div className="text-[11px] font-black text-slate-800">{w.name}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{w.owner} 的武器</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
