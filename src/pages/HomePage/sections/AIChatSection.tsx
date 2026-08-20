import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Bot, Send, Settings, KeyRound, Loader2, Sparkles, Trash2, CheckCircle2, UserPlus } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface CustomPersona {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const DEFAULT_PERSONAS: { id: string; name: string; emoji: string; desc: string }[] = [
  { id: 'coach', name: '毒舌教练', emoji: '🏋️', desc: '任务完成得怎样？别让我失望' },
  { id: 'pet', name: '宠物小叽', emoji: '🐣', desc: '会撒娇会卖萌的任务宠物' },
  { id: 'xiuxian', name: '修仙老祖', emoji: '🧙', desc: '用修仙话术督促你修炼(任务)' },
  { id: 'cat', name: '猫娘管家', emoji: '🐱', desc: '温柔又傲娇的日常管家' },
  { id: 'zhugeliang', name: '诸葛军师', emoji: '🎭', desc: '为你出谋划策的任务军师' },
  { id: 'boss', name: '摸鱼老板', emoji: '👔', desc: '反向督促你的离谱老板' },
  { id: 'free', name: '自由对话', emoji: '💬', desc: '什么都能聊' },
];

export default function AIChatSection() {
  const { token } = useAuth();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [persona, setPersona] = useState(DEFAULT_PERSONAS[0].id);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showPersonaPick, setShowPersonaPick] = useState(false);
  const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>([]);
  const [showNewPersona, setShowNewPersona] = useState(false);
  const [npName, setNpName] = useState('');
  const [npEmoji, setNpEmoji] = useState('🤖');
  const [npPrompt, setNpPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 设置表单
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const loadConfig = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/ai/config', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) {
        setConfigured(res.configured);
        if (res.configured) {
          setBaseUrl(res.baseUrl || '');
          setModel(res.model || '');
        }
      }
    } catch {
      /* ignore */
    }
  }, [token]);

  const loadPersonas = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/ai/personas', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) setCustomPersonas(res.personas);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    void loadConfig();
    void loadPersonas();
  }, [loadConfig, loadPersonas]);

  const createPersona = async () => {
    const name = npName.trim();
    const prompt = npPrompt.trim();
    if (!name || !prompt || !token) {
      toast.error('请填写角色名称和人设');
      return;
    }
    const res = await fetch('/api/ai/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, emoji: npEmoji.trim() || '🤖', systemPrompt: prompt, description: prompt.slice(0, 60) }),
    }).then((r) => r.json());
    if (res.ok) {
      toast.success('角色卡已创建', { description: '现在可以在换角色里选中它' });
      setNpName('');
      setNpEmoji('🤖');
      setNpPrompt('');
      setShowNewPersona(false);
      await loadPersonas();
    } else {
      toast.error(res.message || '创建失败');
    }
  };

  const deletePersona = async (id: string) => {
    if (!token) return;
    if (!window.confirm('确定删除这张角色卡？')) return;
    await fetch(`/api/ai/personas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCustomPersonas((prev) => prev.filter((p) => p.id !== id));
    if (persona === id) setPersona(DEFAULT_PERSONAS[0].id);
    toast.success('角色卡已删除');
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming || !token) return;
    setInput('');
    const history: ChatMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(history);
    setStreaming(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ personaId: persona, messages: history }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '请求失败' }));
        toast.error(err.message || 'AI 请求失败');
        setStreaming(false);
        return;
      }
      // SSE 流式读取
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
        const lines = chunk.split('\n');
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const payload = t.slice(5).trim();
          try {
            const json = JSON.parse(payload);
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
      toast.error('AI 请求失败', { description: '网络错误，请检查配置或稍后重试' });
    } finally {
      setStreaming(false);
    }
  };

  const saveConfig = async () => {
    if (!token) return;
    if (!baseUrl.trim() || !apiKey.trim() || !model.trim()) {
      toast.error('请填写完整的 API 地址、Key 和模型名');
      return;
    }
    const res = await fetch('/api/ai/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model: model.trim() }),
    }).then((r) => r.json());
    if (res.ok) {
      toast.success('配置已保存', { description: 'API Key 已用 AES-256 加密存储，仅你能使用' });
      setConfigured(true);
    } else {
      toast.error(res.message || '保存失败');
    }
  };

  const clearConfig = async () => {
    if (!token) return;
    if (!window.confirm('确定清除 AI 配置？')) return;
    await fetch('/api/ai/config', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setConfigured(false);
    setBaseUrl('');
    setApiKey('');
    setModel('');
    toast.success('已清除配置');
  };

  const currentPersona =
    DEFAULT_PERSONAS.find((p) => p.id === persona) ||
    (() => {
      const c = customPersonas.find((p) => p.id === persona);
      return c ? { id: c.id, name: c.name, emoji: c.emoji, desc: c.description } : null;
    })() ||
    DEFAULT_PERSONAS[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左：聊天窗口 */}
      <div className="lg:col-span-8">
        <div className="report-card overflow-hidden flex flex-col h-[520px]">
          {/* 头部 */}
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b thin-border-b">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0033a0] to-[#2563eb] text-white flex items-center justify-center text-lg">
              {currentPersona.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-800">{currentPersona.name}</div>
              <div className="text-[10px] text-slate-400">{currentPersona.desc}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {!configured && (
                <button
                  onClick={() => toast.info('请先在右侧「API 设置」中填入你的 API 地址和 Key')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider hover:bg-amber-100"
                >
                  <KeyRound className="w-3 h-3" /> 未配置 API
                </button>
              )}
              <button
                onClick={() => setShowPersonaPick((v) => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider hover:border-slate-300"
              >
                <Sparkles className="w-3 h-3" /> 换角色
              </button>
            </div>
          </div>

          {/* 角色选择浮层 */}
          <AnimatePresence>
            {showPersonaPick && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b thin-border-b bg-white"
              >
                <div className="p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEFAULT_PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPersona(p.id);
                          setShowPersonaPick(false);
                        }}
                        className={`p-2.5 text-left border transition-colors bp-no-elevate ${
                          persona === p.id ? 'border-[#0033a0] bg-[#0033a0]/5' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[11px] font-black text-slate-700">
                          {p.emoji} {p.name}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* 自定义角色卡 */}
                  {customPersonas.length > 0 && (
                    <div className="mt-3 pt-3 border-t thin-border-t">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">我的角色卡 · MY PERSONAS</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {customPersonas.map((p) => (
                          <div
                            key={p.id}
                            className={`p-2.5 border transition-colors relative group ${
                              persona === p.id ? 'border-[#0033a0] bg-[#0033a0]/5' : 'border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setPersona(p.id);
                                setShowPersonaPick(false);
                              }}
                              className="w-full text-left bp-no-elevate"
                            >
                              <div className="text-[11px] font-black text-slate-700">
                                {p.emoji} {p.name}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">{p.description}</div>
                            </button>
                            <button
                              onClick={() => void deletePersona(p.id)}
                              className="absolute top-1 right-1 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="删除角色卡"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 新建角色卡 */}
                  <div className="mt-3 pt-3 border-t thin-border-t">
                    {!showNewPersona ? (
                      <button
                        onClick={() => setShowNewPersona(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 transition-colors bp-no-elevate"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> 创建自定义角色卡
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={npEmoji}
                            onChange={(e) => setNpEmoji(e.target.value)}
                            placeholder="😎"
                            className="w-14 h-8 text-center rounded-none bp-no-elevate"
                          />
                          <Input
                            value={npName}
                            onChange={(e) => setNpName(e.target.value)}
                            placeholder="角色名称，如：傲娇学姐"
                            className="flex-1 h-8 text-[11px] rounded-none bp-no-elevate"
                          />
                        </div>
                        <textarea
                          value={npPrompt}
                          onChange={(e) => setNpPrompt(e.target.value)}
                          placeholder="人设描述，例如：你是一个傲娇的学姐，说话总是口是心非，但其实很关心对方。你会用带点嫌弃的语气鼓励别人完成任务。"
                          rows={3}
                          className="w-full text-[11px] border border-slate-200 px-2.5 py-2 outline-none focus:border-[#0033a0] bp-no-elevate"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => void createPersona()} disabled={!npName.trim() || !npPrompt.trim()} className="h-8 px-3 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> 保存角色卡
                          </Button>
                          <Button onClick={() => setShowNewPersona(false)} className="h-8 px-3 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none text-[10px]">
                            取消
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 消息区 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-4xl"
                >
                  {currentPersona.emoji}
                </motion.div>
                <div className="text-xs font-bold text-slate-600">
                  和 {currentPersona.name} 聊聊吧
                </div>
                <div className="text-[11px] text-slate-400 max-w-xs">
                  {configured
                    ? '可以问任务建议、求鼓励、角色扮演，什么都能聊'
                    : '先在「API 设置」里填入你自己的 API 地址和 Key（OpenAI 兼容格式）'}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-[12px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#0033a0] text-white'
                      : 'bg-white border thin-border text-slate-700'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-300 mb-1">
                      {currentPersona.emoji} {currentPersona.name}
                    </div>
                  )}
                  {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
                </div>
              </div>
            ))}
            {streaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1].content === '' && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border thin-border text-[11px] text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> 思考中...
                </div>
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div className="p-4 border-t thin-border-t bg-white">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={configured ? `对${currentPersona.name}说点什么...` : '请先配置 API 再聊天'}
                rows={2}
                className="flex-1 resize-none text-[12px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate"
              />
              <Button
                onClick={() => void send()}
                disabled={!configured || streaming || !input.trim()}
                className="h-auto px-4 bg-[#0033a0] hover:bg-[#002580] rounded-none"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-[9px] text-slate-300 mt-2">
              Enter 发送 · Shift+Enter 换行 · 对话经你配置的 API 处理
            </div>
          </div>
        </div>
      </div>

      {/* 右：API 设置 */}
      <div className="lg:col-span-4">
        <div className="report-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-3.5 h-3.5 text-[#0033a0]" />
            <span className="section-label">API Settings · 接口配置</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="table-header">API 地址 · BASE URL</label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1 或任意 OpenAI 兼容地址"
                className="h-9 text-[11px] rounded-none bp-no-elevate"
              />
            </div>
            <div className="space-y-1.5">
              <label className="table-header">API Key · 密钥</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={configured ? '已加密保存，留空则不修改（重新填写会覆盖）' : 'sk-...'}
                className="h-9 text-[11px] rounded-none bp-no-elevate"
              />
            </div>
            <div className="space-y-1.5">
              <label className="table-header">模型 · MODEL</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini / deepseek-chat / qwen-plus ..."
                className="h-9 text-[11px] rounded-none bp-no-elevate"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={saveConfig} className="flex-1 bg-[#0033a0] hover:bg-[#002580] rounded-none h-9 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> 保存配置
              </Button>
              {configured && (
                <Button onClick={clearConfig} className="px-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-none h-9">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <div className="bg-slate-50 p-3 text-[10px] text-slate-500 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-slate-600 uppercase tracking-wider">
                <Bot className="w-3 h-3" /> 说明
              </div>
              <p>· 支持任意 OpenAI 兼容接口（OpenAI / DeepSeek / Kimi / 通义 / 本地 Ollama 等）</p>
              <p>· API Key 使用 AES-256-GCM 加密后存储于服务器数据库，任何页面不回显明文</p>
              <p>· 密钥仅在请求时于服务器解密转发，配置仅本账号可见可用</p>
              <p>· 若用本地 Ollama：地址填 http://服务器IP:11434/v1</p>
            </div>

            {configured && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-emerald-600">已配置 {model || ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
