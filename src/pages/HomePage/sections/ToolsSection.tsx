import SubTabBar from '@/components/SubTabBar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Dices, Coins, Calculator, Brush, Sparkles, Disc3, Trash2, Eraser } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TTab = 'wheel' | 'fortune' | 'trivia' | 'canvas' | 'dice' | 'calc' | 'sql2er' | 'units' | 'password' | 'json' | 'stopwatch' | 'lottery' | 'clock' | 'datecalc' | 'age' | 'bmi' | 'percent' | 'colorpicker' | 'textstats' | 'caseconv' | 'urlcodec' | 'base64' | 'colorconv' | 'radix' | 'timestamp' | 'loan' | 'countdown' | 'emoji' | 'ipquery' | 'fuel';

const TTABS: { id: TTab; label: string; emoji: string }[] = [
  { id: 'wheel', label: '决策转盘', emoji: '🎡' },
  { id: 'fortune', label: '每日求签', emoji: '🎋' },
  { id: 'trivia', label: '冷知识', emoji: '🧊' },
  { id: 'sql2er', label: 'SQL→ER图', emoji: '🗂️' },
  { id: 'canvas', label: '涂鸦板', emoji: '🎨' },
  { id: 'dice', label: '骰子硬币', emoji: '🎲' },
  { id: 'units', label: '单位换算', emoji: '📏' },
  { id: 'password', label: '密码生成', emoji: '🔑' },
  { id: 'json', label: 'JSON工具', emoji: '🧾' },
  { id: 'stopwatch', label: '秒表', emoji: '⏱️' },
  { id: 'lottery', label: '抽奖器', emoji: '🎁' },
  { id: 'clock', label: '世界时钟', emoji: '🌍' },
  { id: 'datecalc', label: '日期计算', emoji: '🗓️' },
  { id: 'age', label: '年龄计算', emoji: '🎂' },
  { id: 'bmi', label: 'BMI', emoji: '⚖️' },
  { id: 'percent', label: '百分比', emoji: '💯' },
  { id: 'colorpicker', label: '取色器', emoji: '🎨' },
  { id: 'textstats', label: '文本统计', emoji: '🔤' },
  { id: 'caseconv', label: '大小写', emoji: '🔠' },
  { id: 'urlcodec', label: 'URL编解码', emoji: '🔗' },
  { id: 'base64', label: 'Base64', emoji: '🔐' },
  { id: 'colorconv', label: '颜色转换', emoji: '🌈' },
  { id: 'radix', label: '进制转换', emoji: '🔢' },
  { id: 'timestamp', label: '时间戳', emoji: '🕰️' },
  { id: 'loan', label: '房贷计算', emoji: '🏠' },
  { id: 'countdown', label: '倒计时', emoji: '⏳' },
  { id: 'emoji', label: 'Emoji大全', emoji: '😀' },
  { id: 'ipquery', label: 'IP查询', emoji: '🛰️' },
  { id: 'fuel', label: '油耗计算', emoji: '⛽' },
  { id: 'calc', label: '计算器', emoji: '🧮' },
];

export default function ToolsSection() {
  const [tab, setTab] = useState<TTab>('wheel');

  return (
    <div className="space-y-5">
      <div className="report-card p-3">
        <SubTabBar tabs={TTABS} active={tab} onChange={(id) => setTab(id as TTab)} />
      </div>

      {tab === 'wheel' && <WheelTab />}
      {tab === 'fortune' && <FortuneTab />}
      {tab === 'trivia' && <TriviaTab />}
      {tab === 'sql2er' && <Sql2erTab />}
      {tab === 'canvas' && <CanvasTab />}
      {tab === 'dice' && <DiceTab />}
      {tab === 'units' && <UnitsTab />}
      {tab === 'password' && <PasswordTab />}
      {tab === 'json' && <JsonTab />}
      {tab === 'stopwatch' && <StopwatchTab />}
      {tab === 'lottery' && <LotteryTab />}
      {tab === 'clock' && <ClockTab />}
      {tab === 'datecalc' && <DateCalcTab />}
      {tab === 'age' && <AgeTab />}
      {tab === 'bmi' && <BmiTab />}
      {tab === 'percent' && <PercentTab />}
      {tab === 'colorpicker' && <ColorPickerTab />}
      {tab === 'textstats' && <TextStatsTab />}
      {tab === 'caseconv' && <CaseConvTab />}
      {tab === 'urlcodec' && <UrlCodecTab />}
      {tab === 'base64' && <Base64Tab />}
      {tab === 'colorconv' && <ColorConvTab />}
      {tab === 'radix' && <RadixTab />}
      {tab === 'timestamp' && <TimestampTab />}
      {tab === 'loan' && <LoanTab />}
      {tab === 'countdown' && <CountdownTimerTab />}
      {tab === 'emoji' && <EmojiTab />}
      {tab === 'ipquery' && <IpQueryTab />}
      {tab === 'fuel' && <FuelTab />}
      {tab === 'calc' && <CalcTab />}
    </div>
  );
}

/* ---------- 房贷计算 ---------- */
function LoanTab() {
  const [amount, setAmount] = useState('1000000');
  const [rate, setRate] = useState('3.85');
  const [years, setYears] = useState('30');
  const P = Number(amount) || 0;
  const r = (Number(rate) || 0) / 100 / 12;
  const n = (Number(years) || 1) * 12;
  const monthPay = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalInterest = monthPay * n - P;
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Mortgage · 房贷计算（等额本息）</div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="table-header">贷款额 (万)</label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div><label className="table-header">年利率 %</label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div><label className="table-header">年限</label><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
      </div>
      {P > 0 && n > 0 && (
        <div className="mt-4 space-y-2">
          <div className="p-4 bg-[#0033a0]/5 border border-[#0033a0]/10">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">月供</div>
            <div className="text-2xl font-black text-[#0033a0] tabular-nums">{monthPay.toFixed(2)} 元</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 thin-border text-center">
              <div className="text-[9px] font-bold text-slate-400">总还款</div>
              <div className="text-[13px] font-black text-slate-700 tabular-nums">{(monthPay * n).toFixed(0)} 元</div>
            </div>
            <div className="p-3 bg-slate-50 thin-border text-center">
              <div className="text-[9px] font-bold text-slate-400">总利息</div>
              <div className="text-[13px] font-black text-amber-500 tabular-nums">{totalInterest.toFixed(0)} 元</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 倒计时器 ---------- */
function CountdownTimerTab() {
  const [seconds, setSeconds] = useState(300);
  const [input, setInput] = useState('5');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setDone(true);
          toast.success('⏰ 时间到！');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div className="report-card p-6 max-w-xl text-center">
      <div className="section-label mb-4">Countdown Timer · 倒计时</div>
      <div className={`text-6xl font-black font-mono tabular-nums mb-6 ${done ? 'text-red-500' : 'text-[#0033a0]'}`}>{mm}:{ss}</div>
      <div className="flex justify-center gap-2 mb-4">
        <Input type="number" value={input} onChange={(e) => setInput(e.target.value)} className="h-9 w-24 text-center rounded-none bp-no-elevate" placeholder="分钟" />
        <Button onClick={() => { setSeconds(Math.max(1, Number(input) || 1) * 60); setRunning(false); setDone(false); }} className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none h-9">
          设定
        </Button>
      </div>
      <div className="flex justify-center gap-3">
        <Button onClick={() => setRunning((r) => !r)} disabled={done} className={`px-8 h-10 rounded-none ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#0033a0] hover:bg-[#002580]'}`}>
          {running ? '暂停' : '开始'}
        </Button>
        <Button onClick={() => { setSeconds((Number(input) || 1) * 60); setRunning(false); setDone(false); }} className="px-6 h-10 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none">
          重置
        </Button>
      </div>
    </div>
  );
}

/* ---------- Emoji 大全 ---------- */
const EMOJI_GROUPS: { name: string; list: string[] }[] = [
  { name: '表情', list: ['😀', '😁', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '😘', '😜', '🤪', '😎', '🤓', '🥳', '😏', '😢', '😭', '😤', '😡', '🤯', '😴', '🤔', '🤗', '🙄', '😬', '🥺', '😳', '🤩', '😱'] },
  { name: '动物', list: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐺', '🐴', '🦄', '🐝', '🦋', '🐢', '🐍', '🦎', '🐙'] },
  { name: '食物', list: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🍞', '🧀', '🍔', '🍟', '🍕', '🌭', '🍜', '🍣', '🍦'] },
  { name: '物品', list: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📹', '🔋', '🔌', '💡', '🔦', '🕯️', '💎', '📿', '🧲', '🔑', '🔨', '🪓', '🔧', '🔩', '⚙️', '🧰', '📦', '📫', '✉️', '📝', '✏️', '📌', '📎'] },
  { name: '交通', list: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🚨', '🚔', '✈️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛳️', '🚢', '🚇', '🚆'] },
  { name: '自然', list: ['☀️', '🌤️', '⛅', '🌧️', '⛈️', '🌩️', '❄️', '🌨️', '🌈', '☔', '💧', '🌊', '🔥', '🌪️', '🌫️', '🌋', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '🍀', '🍁', '🍂', '🌸', '🌺', '🌻', '🌙', '⭐'] },
  { name: '符号', list: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '🌟', '💫', '⚡', '💥', '💢', '💦', '💨', '🎉', '🎊', '🎁', '🎈', '🎯', '🏆'] },
];

function EmojiTab() {
  const copy = (e: string) => {
    navigator.clipboard?.writeText(e).catch(() => undefined);
    toast.success(`已复制 ${e}`);
  };
  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Emoji 大全 · 点击复制</div>
      <div className="space-y-4">
        {EMOJI_GROUPS.map((g) => (
          <div key={g.name}>
            <div className="table-header mb-2">{g.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.list.map((e) => (
                <button key={e} onClick={() => copy(e)} className="w-10 h-10 bg-slate-50 hover:bg-[#0033a0]/10 border thin-border text-xl flex items-center justify-center transition-colors bp-no-elevate">
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- IP 查询 ---------- */
function IpQueryTab() {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const query = async (target: string) => {
    setLoading(true);
    setResult('');
    try {
      const r = await fetch(`https://ipapi.co/${target}/json/`);
      if (!r.ok) throw new Error('bad');
      const d = await r.json();
      setResult(
        [
          `IP: ${d.ip || target}`,
          `地区: ${d.country_name || '?'} ${d.region || ''} ${d.city || ''}`,
          `运营商: ${d.org || '未知'}`,
          `时区: ${d.timezone || '未知'}`,
          `经纬度: ${d.latitude || '?'}, ${d.longitude || '?'}`,
        ].join('\n'),
      );
    } catch {
      setResult('查询失败：无法连接 IP 服务');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">IP 查询</div>
      <div className="flex gap-2">
        <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="留空查本机 IP，或输入 IP 地址" className="h-9 flex-1 rounded-none bp-no-elevate" />
        <Button onClick={() => void query(ip.trim() || '')} disabled={loading} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">
          {loading ? '查询中...' : '查询'}
        </Button>
      </div>
      {result && <div className="mt-4 p-4 bg-slate-50 thin-border text-[12px] font-bold text-slate-700 whitespace-pre-line font-mono">{result}</div>}
    </div>
  );
}

/* ---------- 油耗计算 ---------- */
function FuelTab() {
  const [km, setKm] = useState('500');
  const [liters, setLiters] = useState('40');
  const [price, setPrice] = useState('8.0');
  const per100 = (Number(liters) || 0) / ((Number(km) || 1) / 100);
  const costPerKm = (per100 * (Number(price) || 0)) / 100;
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Fuel · 油耗计算</div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="table-header">里程 (km)</label><Input type="number" value={km} onChange={(e) => setKm(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div><label className="table-header">加油量 (L)</label><Input type="number" value={liters} onChange={(e) => setLiters(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div><label className="table-header">油价 (元/L)</label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-4 bg-[#0033a0]/5 border border-[#0033a0]/10 text-center">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">百公里油耗</div>
          <div className="text-xl font-black text-[#0033a0] tabular-nums">{per100.toFixed(1)} L</div>
        </div>
        <div className="p-4 bg-slate-50 thin-border text-center">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">每公里成本</div>
          <div className="text-xl font-black text-amber-500 tabular-nums">{costPerKm.toFixed(2)} 元</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 世界时钟 ---------- */
function ClockTab() {
  const zones = [
    { city: '北京', tz: 8 }, { city: '东京', tz: 9 }, { city: '首尔', tz: 9 },
    { city: '新加坡', tz: 8 }, { city: '伦敦', tz: 0 }, { city: '巴黎', tz: 1 },
    { city: '柏林', tz: 1 }, { city: '莫斯科', tz: 3 }, { city: '迪拜', tz: 4 },
    { city: '纽约', tz: -5 }, { city: '洛杉矶', tz: -8 }, { city: '悉尼', tz: 10 },
  ];
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeIn = (tz: number) => {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + tz * 3600000);
  };
  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">World Clock · 世界时钟</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {zones.map((z) => {
          const t = timeIn(z.tz);
          return (
            <div key={z.city} className="p-3 bg-slate-50 thin-border text-center">
              <div className="text-[11px] font-black text-slate-500">{z.city}</div>
              <div className="text-lg font-black text-[#0033a0] font-mono tabular-nums">
                {String(t.getHours()).padStart(2, '0')}:{String(t.getMinutes()).padStart(2, '0')}
              </div>
              <div className="text-[9px] text-slate-300">UTC{z.tz >= 0 ? `+${z.tz}` : z.tz}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 日期计算 ---------- */
function DateCalcTab() {
  const [d1, setD1] = useState(new Date().toISOString().slice(0, 10));
  const [d2, setD2] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const diff = Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Date Calculator · 日期计算</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl items-end">
        <div><label className="table-header">开始日期</label><Input type="date" value={d1} onChange={(e) => setD1(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div><label className="table-header">结束日期</label><Input type="date" value={d2} onChange={(e) => setD2(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div className="p-3 bg-[#0033a0]/5 border border-[#0033a0]/10 text-center">
          <div className="text-2xl font-black text-[#0033a0]">{diff} 天</div>
          <div className="text-[9px] text-slate-400">相差 {Math.abs(Math.round(diff / 7))} 周</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 年龄计算 ---------- */
function AgeTab() {
  const [birth, setBirth] = useState('2000-01-01');
  const [result, setResult] = useState('');
  const calc = () => {
    const b = new Date(birth);
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    let months = now.getMonth() - b.getMonth();
    let days = now.getDate() - b.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((now.getTime() - b.getTime()) / 86400000);
    setResult(`${years} 岁 ${months} 个月 ${days} 天\n出生至今 ${totalDays} 天 ≈ ${(totalDays / 365).toFixed(1)} 年`);
  };
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Age Calculator · 年龄计算</div>
      <div className="flex gap-2 items-end">
        <div className="flex-1"><label className="table-header">出生日期</label><Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <Button onClick={calc} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">计算</Button>
      </div>
      {result && <div className="mt-4 p-4 bg-slate-50 thin-border text-[12px] font-bold text-slate-700 whitespace-pre-line">{result}</div>}
    </div>
  );
}

/* ---------- BMI ---------- */
function BmiTab() {
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const h = Number(height) / 100;
  const w = Number(weight);
  const bmi = h > 0 ? w / (h * h) : 0;
  const level = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
  const color = bmi < 18.5 ? 'text-sky-500' : bmi < 24 ? 'text-emerald-500' : bmi < 28 ? 'text-amber-500' : 'text-red-500';
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">BMI 指数</div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="table-header">身高 (cm)</label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div><label className="table-header">体重 (kg)</label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
      </div>
      <div className="mt-4 p-4 bg-slate-50 thin-border text-center">
        <div className={`text-3xl font-black tabular-nums ${color}`}>{bmi > 0 ? bmi.toFixed(1) : '—'}</div>
        <div className={`text-[11px] font-black mt-1 ${color}`}>{bmi > 0 ? level : ''}</div>
        <div className="mt-2 h-2 bg-gradient-to-r from-sky-400 via-emerald-400 to-red-500 rounded-full" />
        <div className="flex justify-between text-[8px] text-slate-400 mt-1"><span>偏瘦</span><span>正常</span><span>超重</span><span>肥胖</span></div>
      </div>
    </div>
  );
}

/* ---------- 百分比 ---------- */
function PercentTab() {
  const [a, setA] = useState('20');
  const [b, setB] = useState('80');
  const [mode, setMode] = useState<'percentOf' | 'change' | 'ratio'>('percentOf');
  const x = Number(a) || 0;
  const y = Number(b) || 0;
  const r1 = (x / y) * 100;
  const r2 = ((y - x) / x) * 100;
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Percent Calculator · 百分比</div>
      <div className="flex gap-2 mb-4">
        {[
          { id: 'percentOf' as const, label: 'A 占 B 的 %' },
          { id: 'change' as const, label: 'A→B 变化 %' },
          { id: 'ratio' as const, label: 'A:B 比值' },
        ].map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bp-no-elevate ${mode === m.id ? 'bg-[#0033a0] text-white' : 'bg-slate-50 text-slate-500'}`}>{m.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="table-header">数值 A</label><Input type="number" value={a} onChange={(e) => setA(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
        <div><label className="table-header">数值 B</label><Input type="number" value={b} onChange={(e) => setB(e.target.value)} className="h-9 mt-1 rounded-none bp-no-elevate" /></div>
      </div>
      <div className="mt-4 p-4 bg-[#0033a0]/5 border border-[#0033a0]/10 text-center text-lg font-black text-[#0033a0]">
        {mode === 'percentOf' && `${x} 是 ${y} 的 ${r1.toFixed(2)}%`}
        {mode === 'change' && `${x} → ${y} 变化 ${r2.toFixed(2)}%`}
        {mode === 'ratio' && `${x} : ${y} = ${(x / (x + y || 1) * 100).toFixed(1)}% : ${(y / (x + y || 1) * 100).toFixed(1)}%`}
      </div>
    </div>
  );
}

/* ---------- 取色器 ---------- */
function ColorPickerTab() {
  const [color, setColor] = useState('#0033a0');
  const [history, setHistory] = useState<string[]>(['#0033a0', '#fb7299', '#10b981', '#f59e0b', '#ef4444']);
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Color Picker · 取色器</div>
      <div className="flex gap-4 items-center">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-24 h-24 cursor-pointer border-0 bg-transparent" />
        <div>
          <div className="text-xl font-black font-mono text-slate-800">{color}</div>
          <div className="text-[10px] text-slate-400 mt-1">HEX 格式</div>
          <button
            onClick={() => {
              setHistory((h) => [color, ...h.filter((c) => c !== color)].slice(0, 8));
              navigator.clipboard?.writeText(color).catch(() => undefined);
            }}
            className="mt-2 px-3 py-1 bg-[#0033a0] text-white text-[10px] font-black bp-no-elevate"
          >
            收藏并复制
          </button>
        </div>
      </div>
      <div className="flex gap-2 mt-5 flex-wrap">
        {history.map((c) => (
          <button key={c} onClick={() => setColor(c)} className="w-10 h-10 border thin-border" style={{ background: c }} title={c} />
        ))}
      </div>
    </div>
  );
}

/* ---------- 文本统计 ---------- */
function TextStatsTab() {
  const [text, setText] = useState('');
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 0;
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (text.match(/[a-zA-Z]/g) || []).length;
  const nums = (text.match(/[0-9]/g) || []).length;
  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Text Stats · 文本统计</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="输入或粘贴文本..." className="w-full text-[12px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: '总字符', v: chars }, { label: '去空格', v: charsNoSpace },
          { label: '单词数', v: words }, { label: '行数', v: lines },
          { label: '中文', v: cn }, { label: '英文', v: en }, { label: '数字', v: nums },
        ].map((s) => (
          <div key={s.label} className="p-3 bg-slate-50 thin-border text-center">
            <div className="text-xl font-black text-[#0033a0] tabular-nums">{s.v}</div>
            <div className="text-[9px] font-bold text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 大小写转换 ---------- */
function CaseConvTab() {
  const [text, setText] = useState('Hello World');
  const [mode, setMode] = useState<'upper' | 'lower' | 'title' | 'sentence' | 'reverse' | 'camel'>('upper');
  const convert = (t: string) => {
    switch (mode) {
      case 'upper': return t.toUpperCase();
      case 'lower': return t.toLowerCase();
      case 'title': return t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
      case 'sentence': return t.toLowerCase().replace(/(^\s*\w|[.!?。！？]\s*\w)/g, (c) => c.toUpperCase());
      case 'reverse': return t.split('').reverse().join('');
      case 'camel': return t.toLowerCase().replace(/[^a-z0-9]+([a-z0-9])/g, (_, c) => c.toUpperCase());
    }
  };
  const out = convert(text);
  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Case Converter · 大小写转换</div>
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { id: 'upper' as const, label: '全大写' }, { id: 'lower' as const, label: '全小写' },
          { id: 'title' as const, label: '首字母大写' }, { id: 'sentence' as const, label: '句首大写' },
          { id: 'reverse' as const, label: '反转' }, { id: 'camel' as const, label: '驼峰' },
        ].map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-1.5 text-[10px] font-black bp-no-elevate ${mode === m.id ? 'bg-[#0033a0] text-white' : 'bg-slate-50 text-slate-500'}`}>{m.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full text-[12px] border border-slate-200 px-3 py-2 outline-none bp-no-elevate" />
        <textarea value={out} readOnly rows={6} className="w-full text-[12px] bg-slate-50 border border-slate-100 px-3 py-2 outline-none" />
      </div>
    </div>
  );
}

/* ---------- URL 编解码 ---------- */
function UrlCodecTab() {
  const [text, setText] = useState('');
  const [out, setOut] = useState('');
  const [err, setErr] = useState('');
  const doDecode = (fn: () => string) => {
    try { setOut(fn()); setErr(''); } catch { setErr('无法解码：内容包含非法字符'); setOut(''); }
  };
  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">URL Codec · URL 编解码</div>
      <div className="flex gap-2 mb-3">
        <Button onClick={() => { setOut(encodeURIComponent(text)); setErr(''); }} className="h-8 px-4 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[10px]">编码</Button>
        <Button onClick={() => doDecode(() => decodeURIComponent(text))} className="h-8 px-4 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none text-[10px]">解码</Button>
        <Button onClick={() => doDecode(() => decodeURIComponent(encodeURIComponent(text)))} className="h-8 px-4 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none text-[10px]">双重解码</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="输入内容..." className="w-full text-[12px] border border-slate-200 px-3 py-2 outline-none bp-no-elevate" />
        <textarea value={out} readOnly rows={6} className={`w-full text-[12px] px-3 py-2 outline-none ${err ? 'bg-red-50 text-red-500' : 'bg-slate-50'}`} placeholder={err || '结果...'} />
      </div>
    </div>
  );
}

/* ---------- Base64 ---------- */
function Base64Tab() {
  const [text, setText] = useState('');
  const [out, setOut] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Base64 编解码</div>
      <div className="flex gap-2 mb-3">
        <Button onClick={() => { setOut(btoa(unescape(encodeURIComponent(text)))); setErr(''); }} className="h-8 px-4 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[10px]">编码</Button>
        <Button onClick={() => { try { setOut(decodeURIComponent(escape(atob(text)))); setErr(''); } catch { setErr('解码失败：不是合法的 Base64'); setOut(''); } }} className="h-8 px-4 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none text-[10px]">解码</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full text-[12px] font-mono border border-slate-200 px-3 py-2 outline-none bp-no-elevate" />
        <textarea value={out} readOnly rows={6} className={`w-full text-[12px] font-mono px-3 py-2 outline-none ${err ? 'bg-red-50 text-red-500' : 'bg-slate-50'}`} placeholder={err || '结果...'} />
      </div>
    </div>
  );
}

/* ---------- 颜色转换 ---------- */
function ColorConvTab() {
  const [hex, setHex] = useState('#3366ff');
  const parse = (h: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const c = parse(hex);
  const rgb = c ? `rgb(${c.r}, ${c.g}, ${c.b})` : '';
  const hsl = c
    ? (() => {
        const r = c.r / 255, g = c.g / 255, b = c.b / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
          h *= 60;
        }
        return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
      })()
    : '';
  const cmyk = c ? `cmyk(${Math.round((1 - c.r / 255) * 100)}%, ${Math.round((1 - c.g / 255) * 100)}%, ${Math.round((1 - c.b / 255) * 100)}%, 0%)` : '';
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Color Converter · 颜色转换</div>
      <div className="flex gap-3 items-center">
        <Input value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#RRGGBB" className="h-10 w-40 font-mono rounded-none bp-no-elevate" />
        <div className="w-16 h-10 border thin-border" style={{ background: c ? rgb : '#fff' }} />
      </div>
      {!c && <div className="mt-2 text-[10px] font-bold text-red-500">请输入有效的 6 位 HEX 颜色</div>}
      {c && (
        <div className="mt-4 space-y-2">
          {[
            { label: 'HEX', v: hex.startsWith('#') ? hex : `#${hex}` },
            { label: 'RGB', v: rgb },
            { label: 'HSL', v: hsl },
            { label: 'CMYK', v: cmyk },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 p-2.5 bg-slate-50 thin-border">
              <span className="text-[9px] font-black text-slate-400 w-10">{row.label}</span>
              <span className="text-[11px] font-mono font-bold text-slate-700 flex-1">{row.v}</span>
              <button onClick={() => { navigator.clipboard?.writeText(row.v).catch(() => undefined); }} className="text-[9px] font-black text-[#0033a0] hover:underline">复制</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 进制转换 ---------- */
function RadixTab() {
  const [num, setNum] = useState('255');
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(16);
  const n = Number.parseInt(num, from);
  const valid = !Number.isNaN(n) && n >= 0;
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Base Converter · 进制转换</div>
      <div className="grid grid-cols-2 gap-4 items-end">
        <div><label className="table-header">数值</label><Input value={num} onChange={(e) => setNum(e.target.value)} className="h-9 mt-1 font-mono rounded-none bp-no-elevate" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="table-header">从</label>
            <select value={from} onChange={(e) => setFrom(Number(e.target.value))} className="w-full h-9 mt-1 border border-slate-200 text-[12px] px-2 outline-none bp-no-elevate">
              <option value={2}>二进制</option><option value={8}>八进制</option><option value={10}>十进制</option><option value={16}>十六进制</option>
            </select>
          </div>
          <div><label className="table-header">到</label>
            <select value={to} onChange={(e) => setTo(Number(e.target.value))} className="w-full h-9 mt-1 border border-slate-200 text-[12px] px-2 outline-none bp-no-elevate">
              <option value={2}>二进制</option><option value={8}>八进制</option><option value={10}>十进制</option><option value={16}>十六进制</option>
            </select>
          </div>
        </div>
      </div>
      {!valid && <div className="mt-3 text-[10px] font-bold text-red-500">不是合法的 {from} 进制数字</div>}
      {valid && (
        <div className="mt-4 space-y-2">
          {[
            { label: '二进制', v: n.toString(2) },
            { label: '八进制', v: n.toString(8) },
            { label: '十进制', v: n.toString(10) },
            { label: '十六进制', v: n.toString(16).toUpperCase() },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 p-2.5 bg-slate-50 thin-border">
              <span className="text-[9px] font-black text-slate-400 w-12">{row.label}</span>
              <span className="text-[11px] font-mono font-bold text-slate-700 flex-1 break-all">{row.v}</span>
              <button onClick={() => { navigator.clipboard?.writeText(row.v).catch(() => undefined); }} className="text-[9px] font-black text-[#0033a0] hover:underline">复制</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 时间戳转换 ---------- */
function TimestampTab() {
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)));
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 19));
  const toDate = () => {
    const sec = Number(ts);
    if (Number.isNaN(sec)) return;
    const d = new Date(sec < 1e12 ? sec * 1000 : sec);
    setDateStr(d.toISOString().slice(0, 19));
  };
  const toTs = () => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return;
    setTs(String(Math.floor(d.getTime() / 1000)));
  };
  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Timestamp · 时间戳转换</div>
      <div className="flex gap-2 items-end mb-3">
        <div className="flex-1"><label className="table-header">时间戳（秒/毫秒）</label><Input value={ts} onChange={(e) => setTs(e.target.value)} className="h-9 mt-1 font-mono rounded-none bp-no-elevate" /></div>
        <Button onClick={toDate} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">→ 转日期</Button>
      </div>
      <div className="flex gap-2 items-end">
        <div className="flex-1"><label className="table-header">日期时间（UTC）</label><Input value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="h-9 mt-1 font-mono rounded-none bp-no-elevate" /></div>
        <Button onClick={toTs} className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none h-9">→ 转时间戳</Button>
      </div>
      <Button onClick={() => { setTs(String(Math.floor(Date.now() / 1000))); setDateStr(new Date().toISOString().slice(0, 19)); }} className="mt-3 w-full bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-none h-8 text-[10px]">
        当前时间
      </Button>
    </div>
  );
}

/* ---------- SQL → ER 图（iframe 嵌入独立工具） ---------- */
function Sql2erTab() {
  return (
    <div className="report-card overflow-hidden">
      <div className="p-4 flex items-center gap-3 bg-slate-50 thin-border-b">
        <div className="w-9 h-9 bg-[#0033a0]/10 flex items-center justify-center text-lg">🗂️</div>
        <div className="min-w-0">
          <div className="text-[13px] font-black text-slate-800">SQL / DBML → ER 图生成器</div>
          <div className="text-[10px] text-slate-400">粘贴 CREATE TABLE 或 DBML，一键生成 Chen 模型 ER 图（开源工具）</div>
        </div>
        <button
          onClick={() => window.open('/tools/sql2er/', '_blank')}
          className="ml-auto px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider shrink-0"
        >
          全屏打开 ↗
        </button>
      </div>
      <iframe
        src="/tools/sql2er/"
        title="SQL to ER Diagram Generator"
        className="w-full border-0"
        style={{ height: '680px' }}
        loading="lazy"
      />
    </div>
  );
}

/* ---------- 单位换算 ---------- */
function UnitsTab() {
  const categories = {
    length: { label: '长度', unit: ['米', '千米', '厘米', '毫米', '英尺', '英寸', '英里'], toMeter: [1, 1000, 0.01, 0.001, 0.3048, 0.0254, 1609.344] },
    weight: { label: '重量', unit: ['千克', '克', '毫克', '吨', '斤', '磅', '盎司'], toMeter: [1, 0.001, 0.000001, 1000, 0.5, 0.453592, 0.0283495] },
    temperature: { label: '温度', unit: ['摄氏度 ℃', '华氏度 ℉', '开尔文 K'], toMeter: [] },
    area: { label: '面积', unit: ['平方米', '平方千米', '公顷', '亩', '平方英尺', '英亩'], toMeter: [1, 1000000, 10000, 666.667, 0.092903, 4046.86] },
  };
  const [cat, setCat] = useState<keyof typeof categories>('length');
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(1);

  const c = categories[cat];
  const num = Number(value) || 0;
  const result =
    cat === 'temperature'
      ? (() => {
          const v = num;
          const f = from % 3;
          const t = to % 3;
          let celsius = f === 0 ? v : f === 1 ? ((v - 32) * 5) / 9 : v - 273.15;
          const out = t === 0 ? celsius : t === 1 ? (celsius * 9) / 5 + 32 : celsius + 273.15;
          return out;
        })()
      : (num * c.toMeter[from]) / c.toMeter[to];

  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Unit Converter · 单位换算</div>
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(categories) as (keyof typeof categories)[]).map((k) => (
          <button
            key={k}
            onClick={() => {
              setCat(k);
              setFrom(0);
              setTo(1);
            }}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors bp-no-elevate ${
              cat === k ? 'bg-[#0033a0] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {categories[k].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-2xl">
        <div>
          <label className="table-header">数值 · VALUE</label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="h-10 mt-1 rounded-none bp-no-elevate" />
        </div>
        <div>
          <label className="table-header">从 · FROM</label>
          <select value={from} onChange={(e) => setFrom(Number(e.target.value))} className="w-full h-10 mt-1 border border-slate-200 text-[12px] px-2 outline-none bp-no-elevate">
            {c.unit.map((u, i) => (
              <option key={u} value={i}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="table-header">到 · TO</label>
          <select value={to} onChange={(e) => setTo(Number(e.target.value))} className="w-full h-10 mt-1 border border-slate-200 text-[12px] px-2 outline-none bp-no-elevate">
            {c.unit.map((u, i) => (
              <option key={u} value={i}>{u}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 p-4 bg-[#0033a0]/5 border border-[#0033a0]/10 max-w-2xl">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">结果 · RESULT</div>
        <div className="text-xl font-black text-[#0033a0] tabular-nums">
          {num} {c.unit[from]} = {Number.isFinite(result) ? result.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—'} {c.unit[to]}
        </div>
      </div>
    </div>
  );
}

/* ---------- 随机密码生成 ---------- */
function PasswordTab() {
  const [len, setLen] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const generate = () => {
    const sets = [
      upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
      lower ? 'abcdefghijklmnopqrstuvwxyz' : '',
      digits ? '0123456789' : '',
      symbols ? '!@#$%^&*()-_=+[]{};:,.?' : '',
    ].filter(Boolean);
    if (sets.length === 0) {
      toast.error('至少选择一种字符类型');
      return;
    }
    const all = sets.join('');
    let pwd = '';
    // 保证每种选中类型至少出现一次
    for (const s of sets) pwd += s[Math.floor(Math.random() * s.length)];
    for (let i = sets.length; i < len; i++) pwd += all[Math.floor(Math.random() * all.length)];
    setPassword(pwd.split('').sort(() => Math.random() - 0.5).join(''));
  };

  const strength = (p: string) => {
    let score = 0;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score <= 1 ? '弱' : score === 2 ? '中' : score === 3 ? '强' : '极强';
  };

  return (
    <div className="report-card p-6 max-w-xl">
      <div className="section-label mb-4">Password Generator · 随机密码</div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 w-16">长度</span>
          <input type="range" min={8} max={32} value={len} onChange={(e) => setLen(Number(e.target.value))} className="flex-1 accent-[#0033a0]" />
          <span className="text-[12px] font-black text-slate-700 tabular-nums w-6">{len}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { k: upper, set: setUpper, label: '大写字母 A-Z' },
            { k: lower, set: setLower, label: '小写字母 a-z' },
            { k: digits, set: setDigits, label: '数字 0-9' },
            { k: symbols, set: setSymbols, label: '符号 !@#$' },
          ].map((o) => (
            <button
              key={o.label}
              onClick={() => o.set(!o.k)}
              className={`flex items-center gap-2 px-3 py-2 border text-[11px] font-bold transition-colors bp-no-elevate ${
                o.k ? 'bg-[#0033a0]/5 border-[#0033a0] text-[#0033a0]' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-3.5 h-3.5 flex items-center justify-center text-[9px] border ${o.k ? 'bg-[#0033a0] border-[#0033a0] text-white' : 'border-slate-300'}`}>
                {o.k ? '✓' : ''}
              </span>
              {o.label}
            </button>
          ))}
        </div>
        <Button onClick={generate} className="w-full bg-[#0033a0] hover:bg-[#002580] rounded-none h-10">
          生成密码
        </Button>
        {password && (
          <div className="p-4 bg-slate-50 thin-border">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[15px] font-black text-slate-800 break-all flex-1">{password}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 ${strength(password) === '极强' || strength(password) === '强' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {strength(password)}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(password).catch(() => undefined);
                toast.success('已复制到剪贴板');
              }}
              className="mt-2 text-[10px] font-black text-[#0033a0] hover:underline"
            >
              📋 复制
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- JSON 工具 ---------- */
function JsonTab() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 格式错误');
      setOutput('');
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 格式错误');
      setOutput('');
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(output).catch(() => undefined);
    toast.success('已复制');
  };

  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">JSON Formatter · 格式化 / 压缩 / 校验</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="table-header">输入 · INPUT</span>
            <div className="flex gap-2">
              <Button onClick={format} className="h-7 px-3 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[10px]">格式化</Button>
              <Button onClick={minify} className="h-7 px-3 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none text-[10px]">压缩</Button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "任务系统","version": 3}'
            rows={14}
            className="w-full font-mono text-[11px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate"
          />
          {error && <div className="mt-1 text-[10px] font-bold text-red-500">⚠️ {error}</div>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="table-header">输出 · OUTPUT</span>
            <button onClick={copy} disabled={!output} className="text-[10px] font-black text-[#0033a0] hover:underline disabled:opacity-30">📋 复制</button>
          </div>
          <textarea value={output} readOnly rows={14} className="w-full font-mono text-[11px] bg-slate-50 border border-slate-100 px-3 py-2 outline-none" />
        </div>
      </div>
    </div>
  );
}

/* ---------- 秒表 ---------- */
function StopwatchTab() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    const start = Date.now() - ms;
    timerRef.current = setInterval(() => setMs(Date.now() - start), 47);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, ms]);

  const fmt = (m: number) => {
    const min = Math.floor(m / 60000);
    const sec = Math.floor((m % 60000) / 1000);
    const cs = Math.floor((m % 1000) / 10);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  return (
    <div className="report-card p-8 text-center">
      <div className="section-label mb-6">Stopwatch · 秒表</div>
      <div className="text-6xl font-black text-[#0033a0] font-mono tabular-nums mb-8">{fmt(ms)}</div>
      <div className="flex justify-center gap-3 mb-6">
        <Button onClick={() => setRunning((r) => !r)} className={`px-8 h-11 rounded-none ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#0033a0] hover:bg-[#002580]'}`}>
          {running ? '暂停' : '开始'}
        </Button>
        <Button
          onClick={() => {
            if (running) setLaps((l) => [fmt(ms), ...l].slice(0, 10));
          }}
          className="px-6 h-11 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none"
        >
          计次
        </Button>
        <Button
          onClick={() => {
            setMs(0);
            setRunning(false);
            setLaps([]);
          }}
          className="px-6 h-11 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-none"
        >
          清零
        </Button>
      </div>
      {laps.length > 0 && (
        <div className="max-w-xs mx-auto space-y-1">
          {laps.map((l, i) => (
            <div key={i} className="flex items-center gap-3 p-1.5 bg-slate-50 thin-border text-[11px]">
              <span className="font-black text-slate-300">#{laps.length - i}</span>
              <span className="font-mono font-bold text-slate-600 tabular-nums">{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 抽奖器 ---------- */
function LotteryTab() {
  const [names, setNames] = useState('张三,李四,王五,赵六,孙七');
  const [winner, setWinner] = useState('');
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const draw = () => {
    const list = names.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) {
      toast.error('请输入至少一个名字');
      return;
    }
    setRolling(true);
    let count = 0;
    const total = 12 + Math.floor(Math.random() * 8);
    const timer = setInterval(() => {
      count++;
      setWinner(list[Math.floor(Math.random() * list.length)]);
      if (count >= total) {
        clearInterval(timer);
        setRolling(false);
        const w = list[Math.floor(Math.random() * list.length)];
        setWinner(w);
        setHistory((h) => [w, ...h].slice(0, 8));
        toast.success(`🎉 中奖者：${w}`);
      }
    }, 80);
  };

  return (
    <div className="report-card p-6">
      <div className="section-label mb-4">Lottery · 抽奖器</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="table-header">参与者（逗号或换行分隔）</label>
          <textarea
            value={names}
            onChange={(e) => setNames(e.target.value)}
            rows={6}
            className="w-full mt-2 text-[12px] border border-slate-200 px-3 py-2 outline-none focus:border-[#0033a0] bp-no-elevate"
          />
          <Button onClick={draw} disabled={rolling} className="mt-3 w-full bg-[#0033a0] hover:bg-[#002580] rounded-none h-10">
            {rolling ? '抽奖中...' : '🎁 开始抽奖'}
          </Button>
        </div>
        <div className="text-center">
          <div className="h-40 bg-gradient-to-br from-[#0033a0]/5 to-transparent border thin-border flex items-center justify-center mb-4">
            <motion.div key={winner || 'x'} animate={rolling ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.4, repeat: Infinity }} className="text-3xl font-black text-[#0033a0] px-4 text-center break-all">
              {winner || '？'}
            </motion.div>
          </div>
          {history.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {history.map((h, i) => (
                <span key={i} className={`text-[10px] font-bold px-2 py-1 ${i === 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                  {i === 0 ? '🏆 ' : ''}{h}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- 决策转盘 ---------- */
function WheelTab() {
  const [options, setOptions] = useState('去学习,去运动,去睡觉,去干饭');
  const [result, setResult] = useState('');
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    const list = options.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    if (list.length < 2) {
      toast.error('至少输入两个选项，用逗号分隔');
      return;
    }
    setSpinning(true);
    setResult('');
    let count = 0;
    const total = 10 + Math.floor(Math.random() * 6);
    const timer = setInterval(() => {
      count++;
      setResult(list[Math.floor(Math.random() * list.length)]);
      if (count >= total) {
        clearInterval(timer);
        setSpinning(false);
        const final = list[Math.floor(Math.random() * list.length)];
        setResult(final);
        toast.success(`🎡 命运选择了：${final}`);
      }
    }, 90);
  };

  return (
    <div className="report-card p-6 text-center">
      <div className="section-label mb-4">Decision Wheel · 选择困难症救星</div>
      <div className="flex gap-2 mb-6 max-w-xl mx-auto">
        <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="选项用逗号分隔，如：吃火锅,吃烧烤,吃泡面" className="h-9 flex-1 rounded-none bp-no-elevate" />
        <Button onClick={spin} disabled={spinning} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9">
          <Disc3 className={`w-4 h-4 mr-1.5 ${spinning ? 'animate-spin' : ''}`} /> 转！
        </Button>
      </div>
      <motion.div
        key={result || 'x'}
        animate={spinning ? { rotate: [0, 360] } : {}}
        transition={{ duration: 0.5, repeat: spinning ? Infinity : 0 }}
        className="mx-auto w-44 h-44 rounded-full bg-gradient-to-br from-[#0033a0] to-[#2563eb] flex items-center justify-center shadow-lg mb-5"
      >
        <div className="w-36 h-36 rounded-full bg-white flex items-center justify-center px-3">
          <span className="text-lg font-black text-[#0033a0] truncate">{result || '?'}</span>
        </div>
      </motion.div>
      <div className="text-[10px] text-slate-400">犹豫不决时，让转盘替你决定</div>
    </div>
  );
}

/* ---------- 每日求签 ---------- */
const SIGN_POOL = [
  { rank: '上上签', text: '今日诸事顺遂，考试必过，面试必中，出门捡钱，属于你的一天。', emoji: '🌟' },
  { rank: '上签', text: '宜行动，忌拖延。今天迈出的每一步都会算数。', emoji: '✨' },
  { rank: '中上签', text: '小确幸正在路上，保持微笑，好事会主动找你。', emoji: '😊' },
  { rank: '中签', text: '平平淡淡才是真，今天适合沉淀，不宜冲动消费。', emoji: '🧘' },
  { rank: '中下签', text: '今天可能有点小波折，但稳住心态，问题不大。', emoji: '🌊' },
  { rank: '下签', text: '诸事不宜？不存在的。签文是假的，努力是真的。', emoji: '💪' },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function FortuneTab() {
  const today = new Date().toISOString().slice(0, 10);
  const sign = SIGN_POOL[hashStr(today) % SIGN_POOL.length];
  const [shaking, setShaking] = useState(false);

  const draw = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  return (
    <div className="report-card p-8 text-center">
      <div className="section-label mb-2">Daily Fortune · 每日一签</div>
      <div className="text-[10px] text-slate-400 mb-6">今日签文 · {today}</div>
      <motion.div
        animate={shaking ? { rotate: [0, -8, 8, -6, 6, 0], x: [0, -4, 4, -3, 3, 0] } : {}}
        transition={{ duration: 0.6 }}
        className="text-6xl mb-4 cursor-pointer select-none"
        onClick={draw}
        title="摇一摇"
      >
        🎋
      </motion.div>
      <div className="inline-block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-8 py-6 mb-4">
        <div className="text-lg font-black text-amber-600 mb-2">{sign.emoji} {sign.rank}</div>
        <div className="text-[13px] text-slate-700 max-w-md leading-relaxed">{sign.text}</div>
      </div>
      <div className="text-[9px] text-slate-300">点击竹签摇签 · 每天固定一支，不准反驳</div>
    </div>
  );
}

/* ---------- 冷知识 ---------- */
const TRIVIA_POOL = [
  '香蕉是浆果，草莓不是。植物学家的世界就是这么不讲道理。',
  '海獭睡觉时会手拉手，防止被海浪冲散。',
  '你的大脑在睡觉时比看电视时更活跃。',
  '蜂蜜几乎不会变质，考古学家挖出过 3000 年前的蜂蜜还能吃。',
  '章鱼有三颗心脏，其中两颗负责鳃，一颗负责全身。',
  '北极熊的皮肤是黑色的，毛其实是透明的。',
  '你永远无法用舌头舔到自己的手肘(99% 的人会当场尝试)。',
  '宇航员在太空会长高 3-5 厘米。',
  '人的身体里有足够多的铁，能打一枚 3 厘米长的钉子。',
  '考拉指纹和人类的几乎一模一样。',
  '蚂蚁从不睡觉，但会打盹。',
  '地球在自转,但你和你的手机每秒移动了约 465 米(赤道)。',
  '猫头鹰的眼睛是管状的,所以它转不了眼球,只能转头。',
  '喷嚏的速度可达 160km/h。',
  '全世界每天有 2.5 亿颗鸡蛋被吃掉。',
  '婴儿出生时有大约 300 块骨头,成年后只有 206 块。',
  '闪电的温度是太阳表面温度的 5 倍。',
  '一只蜂鸟每天要采 1000 朵花才能吃饱。',
  '人一生中会花大约 25 年睡觉。',
  '你的胃每 3-4 天就会长出一层新的内壁。',
];

function TriviaTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [idx, setIdx] = useState(hashStr(today) % TRIVIA_POOL.length);

  return (
    <div className="report-card p-8 text-center">
      <div className="section-label mb-4">Did You Know · 每日冷知识</div>
      <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto mb-6">
        <div className="text-4xl mb-3">🧊</div>
        <div className="text-[14px] text-slate-700 leading-relaxed">{TRIVIA_POOL[idx]}</div>
      </motion.div>
      <div className="flex justify-center gap-3">
        <Button onClick={() => setIdx((i) => (i + 1) % TRIVIA_POOL.length)} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9 px-6">
          换一条
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard?.writeText(TRIVIA_POOL[idx]).catch(() => undefined);
            toast.success('已复制到剪贴板');
          }}
          className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none h-9 px-4"
        >
          复制
        </Button>
      </div>
    </div>
  );
}

/* ---------- 涂鸦板 ---------- */
interface CanvasItem {
  id: number;
  dataUrl: string;
  created_at: string;
}

function CanvasTab() {
  const { token } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState('#0033a0');
  const [size, setSize] = useState(4);
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/extras?kind=canvas', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (res.ok) setItems(res.items as CanvasItem[]);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * canvas.width, y: ((e.clientY - rect.top) / rect.height) * canvas.height };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !token) return;
    setSaving(true);
    try {
      // 压缩到 320px 宽
      const small = document.createElement('canvas');
      small.width = 320;
      small.height = (320 / canvas.width) * canvas.height;
      const sctx = small.getContext('2d')!;
      sctx.drawImage(canvas, 0, 0, small.width, small.height);
      const dataUrl = small.toDataURL('image/jpeg', 0.75);
      const res = await fetch('/api/extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind: 'canvas', payload: { dataUrl } }),
      }).then((r) => r.json());
      if (res.ok) {
        toast.success('作品已保存 🎨');
        void load();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="report-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="section-label">Doodle Board · 涂鸦板</div>
          <div className="ml-auto flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 cursor-pointer border-0 bg-transparent" title="画笔颜色" />
            <input type="range" min={1} max={16} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-16 accent-[#0033a0]" title="画笔粗细" />
            <button onClick={clear} className="p-1.5 text-slate-400 hover:text-red-500" title="清空"><Eraser className="w-4 h-4" /></button>
            <button onClick={() => void save()} disabled={saving} className="px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = canvasRef.current!.getContext('2d')!;
            const p = pos(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvasRef.current!.getContext('2d')!;
            const p = pos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
          className="w-full border thin-border bg-white touch-none cursor-crosshair"
        />
        <div className="text-[9px] text-slate-300 mt-2">鼠标/手指作画 · 作品保存到你的账号</div>
      </div>

      <div className="report-card p-6">
        <div className="section-label mb-3">我的作品 · {items.length}</div>
        <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
          {items.length === 0 && <div className="text-[11px] text-slate-400 py-8 text-center col-span-full">还没有作品，画一幅吧</div>}
          {items.map((i) => (
            <div key={i.id} className="relative group border thin-border bg-white">
              <img src={String(i.dataUrl)} alt="涂鸦作品" className="w-full h-auto" />
              <button
                onClick={async () => {
                  if (!token) return;
                  await fetch(`/api/extras/${i.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                  void load();
                }}
                className="absolute top-1 right-1 p-1 bg-white/80 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100"
                title="删除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 骰子 / 硬币 / 随机数 ---------- */
function DiceTab() {
  const [dice, setDice] = useState(1);
  const [coin, setCoin] = useState('正面');
  const [coinFlip, setCoinFlip] = useState(false);
  const [range, setRange] = useState({ min: 1, max: 100, value: 50 });

  const rollDice = () => {
    const v = Math.floor(Math.random() * 6) + 1;
    setDice(v);
    toast.success(`🎲 掷出了 ${v} 点！`);
  };

  const flipCoin = () => {
    setCoinFlip(true);
    setTimeout(() => {
      const r = Math.random() < 0.5 ? '正面' : '反面';
      setCoin(r);
      setCoinFlip(false);
      toast.success(`🪙 ${r}！`);
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="report-card p-6 text-center">
        <div className="section-label mb-4">骰子 · Dice</div>
        <motion.div key={dice} initial={{ scale: 0.8, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="text-7xl mb-4 select-none">
          {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][dice - 1]}
        </motion.div>
        <Button onClick={rollDice} className="bg-[#0033a0] hover:bg-[#002580] rounded-none"><Dices className="w-4 h-4 mr-1.5" /> 掷骰子</Button>
      </div>

      <div className="report-card p-6 text-center">
        <div className="section-label mb-4">硬币 · Coin</div>
        <motion.div
          animate={coinFlip ? { rotateY: [0, 720] } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center mb-4 shadow-md"
        >
          <span className="text-2xl font-black text-white">{coin === '正面' ? '正' : '反'}</span>
        </motion.div>
        <Button onClick={flipCoin} disabled={coinFlip} className="bg-[#0033a0] hover:bg-[#002580] rounded-none"><Coins className="w-4 h-4 mr-1.5" /> 抛硬币</Button>
      </div>

      <div className="report-card p-6 text-center">
        <div className="section-label mb-4">随机数 · Random</div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Input type="number" value={range.min} onChange={(e) => setRange((r) => ({ ...r, min: Number(e.target.value) || 0 }))} className="h-9 w-20 text-center rounded-none bp-no-elevate" />
          <span className="text-slate-400">~</span>
          <Input type="number" value={range.max} onChange={(e) => setRange((r) => ({ ...r, max: Number(e.target.value) || 100 }))} className="h-9 w-20 text-center rounded-none bp-no-elevate" />
        </div>
        <div className="text-5xl font-black text-[#0033a0] mb-4 tabular-nums">{range.value}</div>
        <Button
          onClick={() => {
            const min = Math.min(range.min, range.max);
            const max = Math.max(range.min, range.max);
            const v = min + Math.floor(Math.random() * (max - min + 1));
            setRange((r) => ({ ...r, value: v }));
          }}
          className="bg-[#0033a0] hover:bg-[#002580] rounded-none"
        >
          <Sparkles className="w-4 h-4 mr-1.5" /> 生成
        </Button>
      </div>
    </div>
  );
}

/* ---------- 计算器 ---------- */
function CalcTab() {
  const [display, setDisplay] = useState('0');
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const inputDigit = (d: string) => {
    if (waiting) {
      setDisplay(d);
      setWaiting(false);
    } else {
      setDisplay(display === '0' ? d : display + d);
    }
  };

  const inputDot = () => {
    if (waiting) {
      setDisplay('0.');
      setWaiting(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const doOp = (next: string) => {
    const val = parseFloat(display);
    if (acc === null) {
      setAcc(val);
    } else if (op) {
      const r = calc(acc, val, op);
      setAcc(r);
      setDisplay(String(r));
    }
    setOp(next);
    setWaiting(true);
  };

  const calc = (a: number, b: number, o: string): number => {
    switch (o) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const equals = () => {
    if (op === null || acc === null) return;
    const r = calc(acc, parseFloat(display), op);
    setDisplay(Number.isFinite(r) ? String(Math.round(r * 1e8) / 1e8) : '错误');
    setAcc(null);
    setOp(null);
    setWaiting(true);
  };

  const clearAll = () => {
    setDisplay('0');
    setAcc(null);
    setOp(null);
    setWaiting(false);
  };

  const Btn = ({ label, onClick, cls = '' }: { label: string; onClick: () => void; cls?: string }) => (
    <button onClick={onClick} className={`h-12 text-[14px] font-black transition-colors bp-no-elevate ${cls}`}>
      {label}
    </button>
  );

  return (
    <div className="report-card p-6 max-w-sm mx-auto">
      <div className="section-label mb-4 text-center">Calculator · 计算器</div>
      <div className="bg-slate-50 border thin-border px-4 py-3 mb-3 text-right">
        <div className="text-[10px] text-slate-400 h-4">{acc !== null ? `${acc} ${op ?? ''}` : ''}</div>
        <div className="text-2xl font-black text-slate-800 tabular-nums truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <Btn label="C" onClick={clearAll} cls="bg-red-50 text-red-500 hover:bg-red-100" />
        <Btn label="÷" onClick={() => doOp('÷')} cls="bg-slate-100 text-slate-600 hover:bg-slate-200" />
        <Btn label="×" onClick={() => doOp('×')} cls="bg-slate-100 text-slate-600 hover:bg-slate-200" />
        <Btn label="⌫" onClick={() => setDisplay(display.length > 1 ? display.slice(0, -1) : '0')} cls="bg-slate-100 text-slate-600 hover:bg-slate-200" />
        <Btn label="7" onClick={() => inputDigit('7')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="8" onClick={() => inputDigit('8')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="9" onClick={() => inputDigit('9')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="-" onClick={() => doOp('-')} cls="bg-slate-100 text-slate-600 hover:bg-slate-200" />
        <Btn label="4" onClick={() => inputDigit('4')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="5" onClick={() => inputDigit('5')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="6" onClick={() => inputDigit('6')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="+" onClick={() => doOp('+')} cls="bg-slate-100 text-slate-600 hover:bg-slate-200" />
        <Btn label="1" onClick={() => inputDigit('1')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="2" onClick={() => inputDigit('2')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="3" onClick={() => inputDigit('3')} cls="bg-white hover:bg-slate-50 border thin-border" />
        <Btn label="=" onClick={equals} cls="bg-[#0033a0] text-white hover:bg-[#002580] row-span-2" />
        <Btn label="0" onClick={() => inputDigit('0')} cls="bg-white hover:bg-slate-50 border thin-border col-span-2" />
        <Btn label="." onClick={inputDot} cls="bg-white hover:bg-slate-50 border thin-border" />
      </div>
    </div>
  );
}
