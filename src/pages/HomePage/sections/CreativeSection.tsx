import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SubTabBar from '@/components/SubTabBar';

type CTab = 'qrcode' | 'mindmap' | 'diagram' | 'markdown' | 'gradient' | 'regex' | 'confetti' | 'regexvis' | 'particles' | 'model3d';

const CTABS: { id: CTab; label: string; emoji: string }[] = [
  { id: 'qrcode', label: '二维码', emoji: '📱' },
  { id: 'mindmap', label: '思维导图', emoji: '🧠' },
  { id: 'diagram', label: '流程图', emoji: '📊' },
  { id: 'markdown', label: 'Markdown', emoji: '📝' },
  { id: 'model3d', label: '3D模型', emoji: '🧊' },
  { id: 'regexvis', label: '正则可视化', emoji: '🔍' },
  { id: 'gradient', label: '渐变生成', emoji: '🌈' },
  { id: 'regex', label: '正则测试', emoji: '🧪' },
  { id: 'particles', label: '粒子背景', emoji: '✨' },
  { id: 'confetti', label: '彩带', emoji: '🎉' },
];

export default function CreativeSection() {
  const [tab, setTab] = useState<CTab>('qrcode');

  return (
    <div className="space-y-5">
      <div className="report-card p-3">
        <SubTabBar tabs={CTABS} active={tab} onChange={(id) => setTab(id as CTab)} />
      </div>

      {tab === 'qrcode' && <QrTab />}
      {tab === 'mindmap' && <MindmapTab />}
      {tab === 'diagram' && <DiagramTab />}
      {tab === 'markdown' && <MarkdownTab />}
      {tab === 'model3d' && <Model3dTab />}
      {tab === 'regexvis' && <IframeToolTab src="/tools/regex-vis/" title="正则可视化 regex-vis（GitHub ★3k+）" hint="可视化正则表达式：输入正则与文本，自动生成匹配流程图" />}
      {tab === 'gradient' && <GradientTab />}
      {tab === 'regex' && <RegexTab />}
      {tab === 'particles' && <IframeToolTab src="/tools/particles/" title="粒子背景 particles.js（GitHub ★48k）" hint="交互式粒子动画背景：移动鼠标粒子会聚拢" />}
      {tab === 'confetti' && <ConfettiTab />}
    </div>
  );
}

/* ---------- 3D 模型预览（Google model-viewer） ---------- */
function Model3dTab() {
  const [modelUrl, setModelUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 注册 model-viewer 自定义元素
    let cancelled = false;
    (async () => {
      try {
        await import('@google/model-viewer');
        if (!cancelled && !customElements.get('model-viewer')) {
          customElements.define('model-viewer', (await import('@google/model-viewer')).ModelViewerElement);
        }
      } catch (e) {
        if (!cancelled) setError('3D 引擎加载失败：' + (e instanceof Error ? e.message : ''));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFile = (file: File) => {
    if (!file) return;
    const okExt = /\.(glb|gltf|obj|stl|fbx|usdz|vrm|dae)$/i.test(file.name);
    if (!okExt) {
      setError('支持的格式：.glb / .gltf / .obj / .stl / .fbx（推荐 .glb）');
      return;
    }
    setError('');
    setLoading(true);
    if (modelUrl.startsWith('blob:')) URL.revokeObjectURL(modelUrl);
    const url = URL.createObjectURL(file);
    setModelUrl(url);
    setFileName(file.name);
    setTimeout(() => setLoading(false), 50);
  };

  return (
    <div className="report-card p-6">
      <div className="section-label mb-1">3D Model Viewer · 3D 模型预览</div>
      <div className="section-subtitle mb-4">基于 Google 开源 model-viewer（WebGL）· 支持 glb/gltf/obj/stl/fbx，可旋转缩放、自动旋转、AR 查看</div>

      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf,.obj,.stl,.fbx,.usdz,.vrm,.dae"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) loadFile(f);
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) loadFile(f);
        }}
        className="border-2 border-dashed border-slate-200 hover:border-[#0033a0] transition-colors p-8 text-center cursor-pointer mb-4"
      >
        <div className="text-3xl mb-2">🧊</div>
        <div className="text-[12px] font-bold text-slate-600">点击选择或拖入 3D 模型文件</div>
        <div className="text-[10px] text-slate-400 mt-1">支持 .glb / .gltf / .obj / .stl / .fbx（推荐 glb）</div>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 text-red-500 text-[11px] font-bold">⚠️ {error}</div>}
      {loading && <div className="text-[11px] text-slate-400 mb-3">加载引擎...</div>}

      {modelUrl && !error && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black text-slate-700">📦 {fileName}</span>
            <span className="text-[9px] text-slate-400">鼠标拖拽旋转 · 滚轮缩放 · 双击复位</span>
          </div>
          <div className="border thin-border bg-slate-900 overflow-hidden">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(() => { const MV = 'model-viewer' as any; return (
              <MV
                src={modelUrl}
                camera-controls
                auto-rotate
                ar
                style={{ width: '100%', height: '520px', display: 'block' }}
                shadow-intensity="1"
                exposure="1"
              />
            ); })()}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = modelUrl;
                a.download = fileName;
                a.click();
              }}
              className="px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider"
            >
              下载模型
            </button>
            <button
              onClick={() => {
                if (modelUrl.startsWith('blob:')) URL.revokeObjectURL(modelUrl);
                setModelUrl('');
                setFileName('');
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider"
            >
              移除
            </button>
          </div>
        </div>
      )}

      {!modelUrl && !error && (
        <div className="text-[10px] text-slate-400 leading-relaxed">
          💡 提示：可以用 Blender / C4D / 3ds Max 导出 glb 文件，或从 Sketchfab、Poly Pizza 等网站下载免费模型直接拖进来预览。
        </div>
      )}
    </div>
  );
}

/* ---------- iframe 嵌入的开源工具 ---------- */
function IframeToolTab({ src, title, hint }: { src: string; title: string; hint: string }) {
  return (
    <div className="report-card overflow-hidden">
      <div className="p-4 flex items-center gap-3 bg-slate-50 thin-border-b">
        <div className="w-9 h-9 bg-[#0033a0]/10 flex items-center justify-center text-lg">🐙</div>
        <div className="min-w-0">
          <div className="text-[13px] font-black text-slate-800">{title}</div>
          <div className="text-[10px] text-slate-400">{hint}</div>
        </div>
        <button
          onClick={() => window.open(src, '_blank')}
          className="ml-auto px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider shrink-0"
        >
          全屏打开 ↗
        </button>
      </div>
      <iframe src={src} title={title} className="w-full border-0" style={{ height: '620px' }} loading="lazy" />
    </div>
  );
}

/* ---------- 二维码（GitHub: soldair/node-qrcode, 10k★） ---------- */
function QrTab() {
  const [text, setText] = useState('https://example.com');
  const [url, setUrl] = useState('');
  const [size, setSize] = useState(260);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(text.trim(), { width: size, margin: 2, errorCorrectionLevel: 'M' });
      setUrl(dataUrl);
    } catch {
      setError('生成失败：内容过长或格式错误');
    } finally {
      setLoading(false);
    }
  }, [text, size]);

  useEffect(() => {
    const t = setTimeout(() => void generate(), 300);
    return () => clearTimeout(t);
  }, [generate]);

  return (
    <div className="report-card p-6">
      <div className="section-label mb-1">QR Code · 二维码生成</div>
      <div className="section-subtitle mb-4">GitHub 开源库 qrcode（★10k+）</div>
      <div className="flex gap-2 mb-4 max-w-2xl">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="输入文本或链接..." className="h-10 flex-1 rounded-none bp-no-elevate" />
        <Button onClick={() => void generate()} disabled={loading} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-10">
          生成
        </Button>
      </div>
      <div className="flex gap-4 items-start flex-wrap">
        {url ? (
          <div className="border thin-border p-3 bg-white">
            <img src={url} alt="二维码" width={size} height={size} />
          </div>
        ) : (
          <div className="w-[260px] h-[260px] bg-slate-50 border thin-border flex items-center justify-center text-[10px] text-slate-300">
            {error || '生成中...'}
          </div>
        )}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500">尺寸：{size}px</div>
          <input type="range" min={120} max={480} step={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="accent-[#0033a0]" />
          {url && (
            <div className="flex gap-2 pt-2">
              <a href={url} download="qrcode.png" className="px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider">
                ⬇ 下载 PNG
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(text).catch(() => undefined);
                  toast.success('内容已复制');
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider"
              >
                复制内容
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- 思维导图（GitHub: ssshooter/mind-elixir, 5k★） ---------- */
function MindmapTab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mind: any = null;
    let cancelled = false;
    (async () => {
      try {
        const MindElixir = (await import('mind-elixir')).default;
        if (cancelled || !containerRef.current) return;
        let seq = 0;
        const nid = () => `me-${++seq}`;
        const mk = (topic: string, children?: { topic: string; children?: unknown[] }[]) => ({
          id: nid(),
          topic,
          direction: 0,
          expanded: true,
          ...(children ? { children: children.map((c) => mk(c.topic, c.children as never)) } : {}),
        });
        const mindData = {
          nodeData: mk('我的网站', [
            { topic: '激励系统', children: [{ topic: '任务打卡' }, { topic: '成就徽章' }, { topic: '积分等级' }] },
            { topic: '娱乐', children: [{ topic: '音乐' }, { topic: '小游戏' }, { topic: '趣味百科' }] },
            { topic: '工具', children: [{ topic: 'B站解析' }, { topic: 'SQL转ER' }, { topic: '二维码' }] },
            { topic: '生活', children: [{ topic: '番茄钟' }, { topic: '日记' }, { topic: '许愿池' }] },
          ]),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mind = new (MindElixir as any)({ el: containerRef.current, editable: true });
        mind.init(mindData);
        mind.bus.addListener('operation', () => {
          // 编辑后自动导出保持到内存
          try {
            mind?.getData();
          } catch {
            /* ignore */
          }
        });
      } catch (e) {
        if (!cancelled) setError('思维导图加载失败：' + (e instanceof Error ? e.message : '未知错误'));
      }
    })();
    return () => {
      cancelled = true;
      mind?.destroy();
    };
  }, []);

  const exportJson = async () => {
    if (!containerRef.current) return;
    try {
      const MindElixir = (await import('mind-elixir')).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inst = (MindElixir as any).instance;
      const data = inst ? inst.getData() : null;
      if (!data) {
        toast.error('请先编辑导图');
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mindmap.json';
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('已导出 JSON');
    } catch {
      toast.error('导出失败');
    }
  };

  return (
    <div className="report-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="section-label mb-0">Mind Map · 思维导图</div>
          <div className="section-subtitle">GitHub 开源库 mind-elixir（★5k+）· 可拖拽编辑</div>
        </div>
        <Button onClick={() => void exportJson()} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-8 text-[10px]">
          导出 JSON
        </Button>
      </div>
      {error && <div className="mb-2 p-2 bg-red-50 text-red-500 text-[11px] font-bold">⚠️ {error}</div>}
      <div ref={containerRef} className="w-full border thin-border" style={{ height: '560px' }} />
    </div>
  );
}

/* ---------- 流程图（GitHub: mermaid-js/mermaid, 70k★） ---------- */
const MERMAID_DEFAULT = `flowchart TD
    A[开始] --> B{有任务吗?}
    B -- 有 --> C[完成任务]
    C --> D[获得积分]
    D --> E[解锁成就]
    E --> F{成就达标?}
    F -- 是 --> G[🎉 弹窗庆祝]
    F -- 否 --> A
    B -- 没有 --> H[摸鱼一会儿]
    H --> A`;

function DiagramTab() {
  const [code, setCode] = useState(MERMAID_DEFAULT);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  const render = useCallback(async () => {
    setError('');
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      const { svg } = await mermaid.render('mmd-' + Date.now(), code);
      setSvg(svg);
    } catch (e) {
      setError('语法错误：' + (e instanceof Error ? e.message.slice(0, 80) : '未知错误'));
      setSvg('');
    }
  }, [code]);

  useEffect(() => {
    const t = setTimeout(() => void render(), 400);
    return () => clearTimeout(t);
  }, [render]);

  const download = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="report-card p-6">
      <div className="section-label mb-1">Diagram · 流程图 / 时序图 / 甘特图</div>
      <div className="section-subtitle mb-4">GitHub 开源库 mermaid（★70k+）· 支持 flowchart / sequenceDiagram / gantt / pie 等</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="table-header mb-2">Mermaid 代码</div>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={16} className="w-full font-mono text-[11px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate" spellCheck={false} />
          {error && <div className="mt-1 text-[10px] font-bold text-red-500">⚠️ {error}</div>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="table-header">实时预览</span>
            <button onClick={download} disabled={!svg} className="text-[10px] font-black text-[#0033a0] hover:underline disabled:opacity-30">
              ⬇ 下载 SVG
            </button>
          </div>
          <div className="border thin-border bg-white p-3 min-h-[380px] overflow-auto" dangerouslySetInnerHTML={{ __html: svg || '<div style="color:#cbd5e1;font-size:11px">渲染中...</div>' }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Markdown（GitHub: markedjs/marked, 33k★） ---------- */
const MD_DEFAULT = `# 欢迎使用 Markdown 🎉

**实时预览**，支持：

- 任务列表
  - [x] 已完成的
  - [ ] 待办事项
- **加粗** / *斜体* / ~~删除线~~ / \`代码\`
- [链接](https://example.com)

> 引用：坚持就是胜利

\`\`\`js
console.log('Hello 任务成就系统!')
\`\`\`

| 功能 | 状态 |
|------|------|
| Markdown | ✅ |
| 实时预览 | ✅ |`;

function MarkdownTab() {
  const [md, setMd] = useState(MD_DEFAULT);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { marked } = await import('marked');
        if (!cancelled) setHtml(marked.parse(md) as string);
      } catch {
        if (!cancelled) setHtml('<p style="color:#ef4444">渲染失败</p>');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [md]);

  const copyHtml = () => {
    navigator.clipboard?.writeText(html).catch(() => undefined);
    toast.success('HTML 已复制');
  };

  return (
    <div className="report-card p-6">
      <div className="section-label mb-1">Markdown · 实时预览</div>
      <div className="section-subtitle mb-4">GitHub 开源库 marked（★33k+）· 左侧编辑右侧预览</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="table-header mb-2">Markdown 源码</div>
          <textarea value={md} onChange={(e) => setMd(e.target.value)} rows={16} className="w-full font-mono text-[11px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate" spellCheck={false} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="table-header">预览</span>
            <button onClick={copyHtml} className="text-[10px] font-black text-[#0033a0] hover:underline">复制 HTML</button>
          </div>
          <div
            className="border thin-border bg-white p-4 min-h-[380px] overflow-auto prose-sm"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- 渐变生成（GitHub: ghosh/uiGradients 配色数据） ---------- */
const GRADIENTS: { name: string; colors: [string, string] }[] = [
  { name: 'Sunrise', colors: ['#ff512f', '#f09819'] },
  { name: 'Oceanic', colors: ['#00c6fb', '#005bea'] },
  { name: 'Mango', colors: ['#ffe259', '#ffa751'] },
  { name: 'Kye Meh', colors: ['#8360c3', '#2ebf91'] },
  { name: 'JShine', colors: ['#12c2e9', '#c471ed'] },
  { name: 'Deep Sea', colors: ['#2c3e50', '#4ca1af'] },
  { name: 'Moonlit', colors: ['#0f2027', '#203a43'] },
  { name: 'Firewatch', colors: ['#cb2d3e', '#ef473a'] },
  { name: 'Juicy Orange', colors: ['#ff8008', '#ffc837'] },
  { name: 'Purple Love', colors: ['#cc2b5e', '#753a88'] },
  { name: 'Cherry', colors: ['#eb3349', '#f45c43'] },
  { name: 'Cool Blues', colors: ['#2193b0', '#6dd5ed'] },
  { name: 'Eternal', colors: ['#f093fb', '#f5576c'] },
  { name: 'Sublime', colors: ['#fc5c7d', '#6a82fb'] },
  { name: 'Peach', colors: ['#ed4264', '#ffedbc'] },
  { name: 'Aqua', colors: ['#13547a', '#80d0c7'] },
];

function GradientTab() {
  const [g, setG] = useState(GRADIENTS[0]);
  const [angle, setAngle] = useState(135);
  const css = `linear-gradient(${angle}deg, ${g.colors[0]}, ${g.colors[1]})`;

  return (
    <div className="report-card p-6">
      <div className="section-label mb-1">Gradient · 渐变生成器</div>
      <div className="section-subtitle mb-4">配色灵感来自 GitHub uiGradients（★6k+）</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {GRADIENTS.map((gr) => (
              <button
                key={gr.name}
                onClick={() => setG(gr)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all bp-no-elevate ${g.name === gr.name ? 'ring-2 ring-[#0033a0] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                style={g.name === gr.name ? { background: `linear-gradient(135deg, ${gr.colors[0]}, ${gr.colors[1]})` } : {}}
              >
                {gr.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500">角度</span>
            <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="flex-1 accent-[#0033a0]" />
            <span className="text-[11px] font-black text-slate-700 tabular-nums">{angle}°</span>
          </div>
          <div>
            <label className="table-header">CSS 代码</label>
            <div className="mt-1 p-3 bg-slate-50 thin-border font-mono text-[11px] text-slate-700 break-all">
              background: {css};
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`background: ${css};`).catch(() => undefined);
                toast.success('CSS 已复制');
              }}
              className="mt-2 px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider"
            >
              复制 CSS
            </button>
          </div>
        </div>
        <div className="border thin-border min-h-[300px] transition-all duration-300" style={{ background: css }} />
      </div>
    </div>
  );
}

/* ---------- 正则测试器（自研，regex101 风格） ---------- */
function RegexTab() {
  const [pattern, setPattern] = useState('\\d{4}-\\d{2}-\\d{2}');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('今天日期 2026-08-06，明天 2026-08-07');
  const [matches, setMatches] = useState<{ text: string; index: number }[]>([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ count: 0, replaceCount: 0 });

  useEffect(() => {
    try {
      const re = new RegExp(pattern, flags);
      const found: { text: string; index: number }[] = [];
      let m: RegExpExecArray | null;
      const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let count = 0;
      while ((m = r.exec(text)) !== null) {
        found.push({ text: m[0], index: m.index });
        count++;
        if (count > 500) break;
      }
      setMatches(found);
      setStats({ count: found.length, replaceCount: (text.match(r) || []).length });
      setError('');
    } catch (e) {
      setError('正则错误：' + (e instanceof Error ? e.message : ''));
      setMatches([]);
    }
  }, [pattern, flags, text]);

  const renderHighlighted = () => {
    if (error) return text;
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    matches.forEach((m, i) => {
      if (m.index > cursor) parts.push(text.slice(cursor, m.index));
      parts.push(
        <mark key={i} className="bg-amber-200 text-slate-900 px-0.5 rounded-sm">
          {m.text}
        </mark>,
      );
      cursor = m.index + m.text.length;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
  };

  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Regex Tester · 正则测试</div>
      <div className="flex gap-2 mb-3 max-w-2xl">
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="/正则表达式/" className="h-10 flex-1 font-mono rounded-none bp-no-elevate" />
        <Input value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="gim" className="h-10 w-20 font-mono rounded-none bp-no-elevate" />
      </div>
      {error && <div className="mb-3 p-2 bg-red-50 text-red-500 text-[11px] font-bold">⚠️ {error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="table-header mb-2">测试文本</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} className="w-full text-[12px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate" />
        </div>
        <div>
          <div className="table-header mb-2">匹配高亮（共 {stats.count} 处）</div>
          <div className="border thin-border bg-slate-50 p-3 min-h-[220px] text-[12px] leading-relaxed whitespace-pre-wrap break-all">
            {renderHighlighted()}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            {matches.slice(0, 20).map((m, i) => (
              <span key={i} className="inline-block mr-2 mb-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 font-mono">
                {m.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 彩带（GitHub: catdad/canvas-confetti, 12.7k★） ---------- */
function ConfettiTab() {
  const fire = async (power: 'small' | 'big' | 'rain') => {
    const confetti = (await import('canvas-confetti')).default;
    if (power === 'small') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } else if (power === 'big') {
      const end = Date.now() + 1200;
      (function frame() {
        confetti({ particleCount: 8, angle: 60, spread: 70, origin: { x: 0 } });
        confetti({ particleCount: 8, angle: 120, spread: 70, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } else {
      const duration = 2500;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 4, startVelocity: 0, ticks: 300, origin: { x: Math.random(), y: -0.1 }, gravity: 0.4, scalar: 0.8 });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  };

  return (
    <div className="report-card p-8 text-center">
      <div className="text-4xl mb-3">🎉</div>
      <div className="section-label mb-1">Confetti · 彩带特效</div>
      <div className="section-subtitle mb-6">GitHub 开源库 canvas-confetti（★12.7k+）· 点一下满屏庆祝</div>
      <div className="flex justify-center gap-3 flex-wrap">
        <Button onClick={() => void fire('small')} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-10 px-6">
          放一点
        </Button>
        <Button onClick={() => void fire('big')} className="bg-amber-500 hover:bg-amber-600 rounded-none h-10 px-6">
          大放送
        </Button>
        <Button onClick={() => void fire('rain')} className="bg-pink-500 hover:bg-pink-600 rounded-none h-10 px-6">
          彩带雨
        </Button>
      </div>
      <div className="text-[9px] text-slate-300 mt-6">点完记得许个愿 ✨</div>
    </div>
  );
}
