import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Send, Loader2, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Persona { persona_id: string; name: string; emoji?: string }
interface Msg { role: 'user' | 'assistant'; content: string }

const LS_VISIBLE = 'petWidgetVisible';

export default function PetSection() {
  const { token } = useAuth();
  const [petVisible, setPetVisible] = useState(() => localStorage.getItem(LS_VISIBLE) !== '0');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // 加载 AI 人设
  useEffect(() => {
    if (!token) return;
    fetch('/api/ai/personas', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setPersonas(d.personas || []);
          if (d.personas?.length) setPersona(d.personas[0].persona_id);
        }
      })
      .catch(() => undefined);
  }, [token]);

  // 悬浮窗显隐设置
  const togglePet = (v: boolean) => {
    setPetVisible(v);
    localStorage.setItem(LS_VISIBLE, v ? '1' : '0');
    window.dispatchEvent(new CustomEvent('pet-visible-change', { detail: v }));
    toast.success(v ? '悬浮桌宠已显示' : '悬浮桌宠已隐藏(可在本页重新打开)');
  };

  // AI 聊天(SSE 流式)
  const send = async () => {
    const text = input.trim();
    if (!text || streaming || !token) return;
    setInput('');
    const history: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(history);
    setStreaming(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personaId: persona || undefined, messages: history }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '请求失败' }));
        toast.error(err.message || 'AI 请求失败');
        setStreaming(false);
        return;
      }
      setMessages([...history, { role: 'assistant', content: '' }]);
      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          try {
            const json = JSON.parse(t.slice(5).trim());
            if (json.type === 'delta') {
              acc += json.content || '';
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: acc };
                return next;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      toast.error('AI 请求失败', { description: '请先在 AI 页配置 API 或检查网络' });
    } finally {
      setStreaming(false);
    }
  };

  // 自动滚动到底
  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight });
  }, [messages]);

  return (
    <div className="space-y-6">
      {/* ============ 桌宠展示(Webmeji 2D) ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="report-card p-5 xl:col-span-3">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-[13px] font-black text-slate-800">🎀 我的桌宠 · 初音未来</span>
            <span className="text-[9px] text-slate-400">开源项目 Webmeji(Shimeji 风格)</span>
          </div>
          <div className="border thin-border bg-slate-50 overflow-hidden">
            <iframe
              src="/tools/webmeji/index.html"
              title="Webmeji 桌宠"
              className="w-full"
              style={{ height: 460 }}
            />
          </div>
          <div className="text-[9px] text-slate-400 mt-2">
            Miku 会在页面底部行走/站立/坐下/跳舞/绊倒,攀爬屏幕边缘悬挂,可以抓住拖拽扔出去,鼠标悬停互动
          </div>
        </div>

        {/* AI 聊天 */}
        <div className="report-card p-5 xl:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-[#0033a0]" />
            <span className="text-[13px] font-black text-slate-800">AI 桌宠对话</span>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="ml-auto h-7 text-[10px] font-bold border thin-border px-1.5 bg-white text-slate-600 focus:outline-none max-w-[130px]"
              title="选择人设"
            >
              {personas.length === 0 && <option value="">默认人设</option>}
              {personas.map((p) => (
                <option key={p.persona_id} value={p.persona_id}>{p.emoji || '🤖'} {p.name}</option>
              ))}
            </select>
          </div>

          <div ref={chatBoxRef} className="flex-1 min-h-[300px] max-h-[380px] overflow-y-auto space-y-2.5 pr-1 mb-3 thin-border p-3 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-[10px] text-slate-400 leading-relaxed py-6 text-center">
                和你的桌宠说点什么吧～
                <br />
                <br />
                💡 首次使用请到「AI」页配置 API(支持任意 OpenAI 兼容接口)
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[85%] p-2.5 text-[11px] leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-[#0033a0] text-white'
                    : 'bg-white thin-border text-slate-700'
                }`}
              >
                {m.content}
              </motion.div>
            ))}
            {streaming && <div className="text-[10px] text-slate-300">…</div>}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void send()}
              placeholder="和桌宠聊天..."
              className="flex-1 h-9 border thin-border px-3 text-[12px] focus:outline-none focus:border-[#0033a0] bp-no-elevate"
              disabled={streaming}
            />
            <button
              onClick={() => void send()}
              disabled={streaming || !input.trim()}
              className="w-10 h-9 bg-[#0033a0] hover:bg-[#002580] text-white flex items-center justify-center disabled:opacity-40 bp-no-elevate"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ============ 设置 ============ */}
      <div className="report-card p-6">
        <div className="section-label mb-3">⚙️ 桌宠设置</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 thin-border">
            <div className="text-xl">{petVisible ? '👁️' : '🙈'}</div>
            <div className="flex-1">
              <div className="text-[12px] font-black text-slate-700">悬浮桌宠</div>
              <div className="text-[9px] text-slate-400">右下角悬浮小窗,所有页面可见</div>
            </div>
            <button
              onClick={() => togglePet(!petVisible)}
              className={`relative w-11 h-6 rounded-full transition-colors bp-no-elevate ${petVisible ? 'bg-[#0033a0]' : 'bg-slate-300'}`}
              title={petVisible ? '点击隐藏' : '点击显示'}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${petVisible ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 thin-border">
            <div className="text-xl">🤖</div>
            <div className="flex-1">
              <div className="text-[12px] font-black text-slate-700">AI 配置</div>
              <div className="text-[9px] text-slate-400">接入任意 OpenAI 兼容 API</div>
            </div>
            <button
              onClick={() => toast.info('请前往「AI」页配置 API Key 与人设')}
              className="px-3 py-1.5 bg-[#0033a0]/10 text-[#0033a0] text-[10px] font-black hover:bg-[#0033a0]/20 bp-no-elevate"
            >
              去配置 →
            </button>
          </div>
        </div>
        <div className="text-[9px] text-slate-300 mt-4">
          💡 提示:悬浮桌宠开关会记住你的选择;AI 对话使用你在「AI」页配置的 API(支持 DeepSeek/OpenAI/Kimi 等任意 OpenAI 兼容服务)。
        </div>
      </div>
    </div>
  );
}
