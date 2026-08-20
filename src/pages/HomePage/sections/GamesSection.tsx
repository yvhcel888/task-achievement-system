import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Gamepad2, RotateCcw, Trophy } from 'lucide-react';

import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';

/* ============ 游戏容器 ============ */
function GameCard({ title, emoji, desc, best, bestUnit = '', zoomed, onZoom, children }: { title: string; emoji: string; desc: string; best: number; bestUnit?: string; zoomed?: boolean; onZoom?: () => void; children: React.ReactNode }) {
  return (
    <div className="report-card p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-[#0033a0]/10 flex items-center justify-center text-lg">{emoji}</div>
        <div className="min-w-0">
          <div className="text-[13px] font-black text-slate-800">{title}</div>
          <div className="text-[10px] text-slate-400">{desc}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {best > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 text-[10px] font-black">
              <Trophy className="w-3 h-3" /> 最高 {best}{bestUnit}
            </div>
          )}
          {onZoom && (
            <button
              onClick={onZoom}
              title={zoomed ? '缩小' : '放大'}
              className="w-7 h-7 bg-slate-100 hover:bg-[#0033a0] hover:text-white text-slate-500 flex items-center justify-center transition-colors bp-no-elevate"
            >
              {zoomed ? '🗗' : '⛶'}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ============ 1. 贪吃蛇 ============ */
function SnakeGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({ snake: [[10, 10]], dir: [1, 0], food: [15, 15], score: 0 });

  const reset = useCallback(() => {
    stateRef.current = {
      snake: [[10, 10]],
      dir: [1, 0],
      food: [Math.floor(Math.random() * 18) + 1, Math.floor(Math.random() * 18) + 1],
      score: 0,
    };
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const CELL = 18;
    const draw = () => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 360, 360);
      const s = stateRef.current;
      // 食物
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.food[0] * CELL, s.food[1] * CELL, CELL - 2, CELL - 2);
      // 蛇
      s.snake.forEach(([x, y], i) => {
        ctx.fillStyle = i === 0 ? '#0033a0' : '#2563eb';
        ctx.fillRect(x * CELL, y * CELL, CELL - 2, CELL - 2);
      });
    };
    const tick = () => {
      if (!running || gameOver) return;
      const s = stateRef.current;
      const head = [s.snake[0][0] + s.dir[0], s.snake[0][1] + s.dir[1]];
      // 撞墙/撞自己
      if (head[0] < 0 || head[0] > 19 || head[1] < 0 || head[1] > 19 || s.snake.some(([x, y]) => x === head[0] && y === head[1])) {
        setGameOver(true);
        setRunning(false);
        if (s.score > 0) {
          setGameScore('snake', s.score);
          toast.success(`🐍 贪吃蛇得分 ${s.score}${s.score > gameBest('snake') ? '，新纪录！' : ''}`);
        }
        return;
      }
      s.snake.unshift(head as [number, number]);
      if (head[0] === s.food[0] && head[1] === s.food[1]) {
        s.score += 10;
        setScore(s.score);
        s.food = [Math.floor(Math.random() * 18) + 1, Math.floor(Math.random() * 18) + 1];
      } else {
        s.snake.pop();
      }
      draw();
    };
    const timer = setInterval(tick, 130);
    draw();
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        if (d[0] !== -s.dir[0] || d[1] !== -s.dir[1]) s.dir = d;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, gameOver]);

  return (
    <GameCard {...props} title="贪吃蛇" emoji="🐍" desc="方向键控制，别咬到自己" best={gameBest('snake')}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 w-full">
          <span className="text-[11px] font-black text-slate-600">得分 {score}</span>
          {gameOver && <span className="text-[11px] font-black text-red-500">💀 撞车了！</span>}
          <Button onClick={reset} className="ml-auto h-7 px-3 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[10px]">
            <RotateCcw className="w-3 h-3 mr-1" /> {running || gameOver ? '重开' : '开始'}
          </Button>
        </div>
        <canvas ref={canvasRef} width={360} height={360} className="w-full max-w-[360px] border thin-border" />
      </div>
    </GameCard>
  );
}

/* ============ 2. 石头剪刀布 ============ */
function RpsGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const choices = [
    { id: 'rock', emoji: '✊', name: '石头' },
    { id: 'paper', emoji: '✋', name: '布' },
    { id: 'scissors', emoji: '✌️', name: '剪刀' },
  ];
  const [player, setPlayer] = useState<string | null>(null);
  const [ai, setAi] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [wins, setWins] = useState(0);
  const [history, setHistory] = useState<('W' | 'L' | 'D')[]>([]);

  const play = (p: string) => {
    const a = choices[Math.floor(Math.random() * 3)].id;
    setPlayer(p);
    setAi(a);
    const beats: Record<string, string> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    let r: 'W' | 'L' | 'D' = 'D';
    if (beats[p] === a) r = 'W';
    else if (beats[a] === p) r = 'L';
    setResult(r);
    if (r === 'W') {
      const nw = wins + 1;
      setWins(nw);
      setHistory((h) => [...h, 'W' as 'W' | 'L' | 'D'].slice(-10));
      if (nw > gameBest('rps')) setGameScore('rps', nw);
      if (nw % 3 === 0) toast.success(`🔥 连胜 ${nw} 局，手气爆棚！`);
    } else {
      setWins(0);
      setHistory((h) => [...h, r as 'L' | 'D'].slice(-10));
    }
  };

  const emojiOf = (id: string | null) => choices.find((c) => c.id === id)?.emoji || '❔';

  return (
    <GameCard {...props} title="石头剪刀布" emoji="✊" desc="和电脑猜拳，连胜纪录" best={gameBest('rps')}>
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-8 py-2">
          <div className="text-center">
            <div className="text-4xl">{emojiOf(player)}</div>
            <div className="text-[9px] font-bold text-slate-400 mt-1">你</div>
          </div>
          <div className="text-[11px] font-black text-slate-300">VS</div>
          <div className="text-center">
            <div className="text-4xl">{emojiOf(ai)}</div>
            <div className="text-[9px] font-bold text-slate-400 mt-1">电脑</div>
          </div>
        </div>
        {result && (
          <div className={`text-[13px] font-black ${result === 'W' ? 'text-emerald-500' : result === 'L' ? 'text-red-500' : 'text-slate-400'}`}>
            {result === 'W' ? '🎉 你赢了！' : result === 'L' ? '😅 电脑赢了' : '🤝 平局'}
          </div>
        )}
        <div className="flex justify-center gap-2">
          {choices.map((c) => (
            <button
              key={c.id}
              onClick={() => play(c.id)}
              className="w-14 h-14 bg-slate-50 hover:bg-[#0033a0]/10 border thin-border flex flex-col items-center justify-center transition-colors bp-no-elevate"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <span className="font-black text-amber-500">当前连胜 {wins}</span>
          {history.length > 0 && (
            <span className="ml-2">{history.map((h, i) => (h === 'W' ? '🟢' : h === 'L' ? '🔴' : '⚪')).join('')}</span>
          )}
        </div>
      </div>
    </GameCard>
  );
}

/* ============ 3. 猜数字 ============ */
function GuessGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [history, setHistory] = useState<{ g: number; hint: string }[]>([]);
  const [done, setDone] = useState(false);

  const reset = () => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setHistory([]);
    setDone(false);
    setGuess('');
  };

  const submit = () => {
    const g = Number(guess);
    if (!g || g < 1 || g > 100) return;
    if (g === target) {
      const steps = history.length + 1;
      setDone(true);
      const best = gameBest('guess');
      if (best === 0 || steps < best) {
        setGameScore('guess', 100 - steps * 5);
        toast.success(`🎯 猜中啦！用了 ${steps} 步${best && steps < best ? '，新纪录！' : ''}`);
      } else {
        toast.success(`🎯 猜中啦！用了 ${steps} 步`);
      }
    } else {
      setHistory((h) => [...h, { g, hint: g < target ? '⬆️ 小了' : '⬇️ 大了' }].slice(-8));
      setGuess('');
    }
  };

  return (
    <GameCard {...props} title="猜数字" emoji="🎲" desc="1-100 之间，尽量少步数猜中" best={gameBest('guess')}>
      <div className="space-y-3">
        <div className="bg-slate-50 p-3 text-center">
          <div className="text-[10px] font-bold text-slate-400 mb-1">目标数字（{done ? target : '???'}）</div>
          {done ? (
            <div className="text-3xl font-black text-emerald-500">{target}</div>
          ) : (
            <div className="text-3xl font-black text-slate-300">???</div>
          )}
        </div>
        {!done && (
          <div className="flex gap-2">
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              type="number"
              min={1}
              max={100}
              placeholder="输入 1-100"
              className="flex-1 h-9 px-3 text-[12px] border border-slate-200 outline-none focus:border-[#0033a0] bp-no-elevate"
            />
            <Button onClick={submit} className="h-9 px-4 bg-[#0033a0] hover:bg-[#002580] rounded-none">猜</Button>
          </div>
        )}
        {history.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {history.map((h, i) => (
              <span key={i} className={`text-[10px] font-bold px-2 py-1 ${h.hint.includes('小') ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                {h.g} {h.hint}
              </span>
            ))}
          </div>
        )}
        {done && (
          <Button onClick={reset} className="w-full h-8 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[11px]">
            <RotateCcw className="w-3 h-3 mr-1" /> 再来一局
          </Button>
        )}
      </div>
    </GameCard>
  );
}

/* ============ 4. 打地鼠 ============ */
function WhackGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const [mole, setMole] = useState(-1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const start = () => {
    setScore(0);
    setTimeLeft(10);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      setMole(Math.floor(Math.random() * 9));
      setTimeout(() => setMole(-1), 650);
    }, 750);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRunning(false);
          clearInterval(spawn);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(spawn);
      clearInterval(timer);
    };
  }, [running]);

  const whack = (i: number) => {
    if (!running || i !== mole) return;
    const ns = score + 1;
    setScore(ns);
    setMole(-1);
    if (ns > gameBest('whack')) setGameScore('whack', ns);
  };

  return (
    <GameCard {...props} title="打地鼠" emoji="🔨" desc="10 秒限时，锤得越多越好" best={gameBest('whack')}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-600">得分 {score}</span>
          <span className="text-[11px] font-black text-slate-400">{running ? `⏱ ${timeLeft}s` : timeLeft === 0 && score > 0 ? '⏰ 时间到！' : ''}</span>
          {!running && (
            <Button onClick={start} className="h-7 px-3 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[10px]">
              <Gamepad2 className="w-3 h-3 mr-1" /> {timeLeft === 0 && score > 0 ? '再来' : '开始'}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <button
              key={i}
              onClick={() => whack(i)}
              className={`h-16 border thin-border flex items-center justify-center text-2xl transition-all bp-no-elevate ${
                mole === i ? 'bg-amber-50 border-amber-200 scale-105' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {mole === i ? '🐹' : i % 2 === 0 ? '🕳️' : ''}
            </button>
          ))}
        </div>
      </div>
    </GameCard>
  );
}

/* ============ 5. 记忆翻牌 ============ */
const MEMO_EMOJIS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🐵', '🦄'];

function MemoGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const [cards, setCards] = useState<{ id: number; emoji: string }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const lockRef = useRef(false);

  const start = () => {
    const deck = [...MEMO_EMOJIS, ...MEMO_EMOJIS]
      .map((emoji, i) => ({ id: i, emoji }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setDone(false);
    lockRef.current = false;
  };

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = (id: number) => {
    if (lockRef.current || flipped.includes(id) || matched.has(id) || done) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [a, b] = next;
      if (cards[a].emoji === cards[b].emoji) {
        const nm = new Set(matched);
        nm.add(a);
        nm.add(b);
        setMatched(nm);
        setFlipped([]);
        lockRef.current = false;
        if (nm.size === cards.length) {
          setDone(true);
          const score = Math.max(10, 100 - moves * 3 - 3);
          setGameScore('memo', score);
          toast.success(`🧠 全部配对！用了 ${moves + 1} 步`);
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const progress = cards.length > 0 ? (matched.size / cards.length) * 100 : 0;

  return (
    <GameCard {...props} title="记忆翻牌" emoji="🧠" desc="找出所有配对的小动物" best={gameBest('memo')}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-600">步数 {moves}</span>
          <div className="flex-1 mx-3 h-1 bg-slate-100">
            <div className="h-full bg-[#0033a0] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Button onClick={start} className="h-7 px-3 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[10px]">
            <RotateCcw className="w-3 h-3 mr-1" /> 重开
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {cards.map((c, i) => {
            const isUp = flipped.includes(i) || matched.has(i);
            return (
              <button
                key={c.id}
                onClick={() => flip(i)}
                className={`h-14 border thin-border flex items-center justify-center text-xl transition-all bp-no-elevate ${
                  isUp ? 'bg-white' : 'bg-[#0033a0] hover:bg-[#002580]'
                }`}
              >
                {isUp ? c.emoji : '❓'}
              </button>
            );
          })}
        </div>
      </div>
    </GameCard>
  );
}

/* ============ 6. 反应测试 ============ */
function ReactionGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const [phase, setPhase] = useState<'idle' | 'wait' | 'go' | 'done'>('idle');
  const [time, setTime] = useState(0);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goTime = useRef(0);

  const start = () => {
    setPhase('wait');
    waitTimer.current = setTimeout(() => {
      setPhase('go');
      goTime.current = Date.now();
    }, 1000 + Math.random() * 2500);
  };

  const click = () => {
    if (phase === 'idle' || phase === 'done') {
      start();
      return;
    }
    if (phase === 'wait') {
      if (waitTimer.current) clearTimeout(waitTimer.current);
      setPhase('done');
      toast.info('😅 太心急了，等它变绿再点');
      return;
    }
    if (phase === 'go') {
      const ms = Date.now() - goTime.current;
      setTime(ms);
      setPhase('done');
      const best = gameBest('reaction');
      if (best === 0 || ms < best) {
        setGameScore('reaction', ms);
        toast.success(`⚡ ${ms}ms！${best > 0 && ms < best ? '新纪录！' : '已保存纪录'}`);
      } else {
        toast.success(`⚡ 反应时间 ${ms}ms`);
      }
    }
  };

  const bg = phase === 'go' ? 'bg-emerald-500 hover:bg-emerald-600' : phase === 'wait' ? 'bg-red-500' : 'bg-slate-100';

  return (
    <GameCard {...props} title="反应测试" emoji="⚡" desc="变绿瞬间点击，测你的手速" best={gameBest('reaction')} bestUnit="ms">
      <div className="space-y-3">
        <button
          onClick={click}
          className={`w-full h-28 ${bg} flex items-center justify-center text-white transition-colors bp-no-elevate`}
        >
          <span className="text-[14px] font-black uppercase tracking-wider">
            {phase === 'idle' && '点击开始'}
            {phase === 'wait' && '等待变绿...'}
            {phase === 'go' && '快点击！'}
            {phase === 'done' && (time ? `${time} ms` : '再来一次')}
          </span>
        </button>
        {phase === 'done' && (
          <Button onClick={start} className="w-full h-8 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[11px]">
            <RotateCcw className="w-3 h-3 mr-1" /> 再测一次
          </Button>
        )}
      </div>
    </GameCard>
  );
}

/* ============ 7. 井字棋（人机） ============ */
type Cell = 'X' | 'O' | null;

function TicTacToeGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [wins, setWins] = useState(0);

  const checkWin = (b: Cell[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b2, c] of lines) {
      if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
    }
    return b.every((v) => v !== null) ? 'draw' : null;
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
  };

  const aiMove = (b: Cell[]): number => {
    // 1. 能赢就赢
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        const t = [...b];
        t[i] = 'O';
        if (checkWin(t) === 'O') return i;
      }
    }
    // 2. 堵玩家
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        const t = [...b];
        t[i] = 'X';
        if (checkWin(t) === 'X') return i;
      }
    }
    // 3. 中心/角/随机
    if (!b[4]) return 4;
    const corners = [0, 2, 6, 8].filter((i) => !b[i]);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    const rest = [1, 3, 5, 7].filter((i) => !b[i]);
    return rest[Math.floor(Math.random() * rest.length)];
  };

  const play = (i: number) => {
    if (board[i] || winner || turn !== 'X') return;
    const nb = [...board];
    nb[i] = 'X';
    setBoard(nb);
    const w = checkWin(nb);
    if (w) {
      if (w === 'X') {
        const nw = wins + 1;
        setWins(nw);
        setGameScore('ttt', nw * 10);
      }
      setWinner(w);
      return;
    }
    setTurn('O');
    setTimeout(() => {
      const ai = aiMove(nb);
      const nb2 = [...nb];
      nb2[ai] = 'O';
      setBoard(nb2);
      setTurn('X');
      const w2 = checkWin(nb2);
      if (w2) setWinner(w2);
    }, 350);
  };

  const resultText = winner === 'X' ? '🎉 你赢了！' : winner === 'O' ? '🤖 电脑赢了' : winner === 'draw' ? '🤝 平局' : turn === 'X' ? '轮到你（X）' : '电脑思考中...';

  return (
    <GameCard {...props} title="井字棋" emoji="⭕" desc="和电脑对战，三连即胜" best={gameBest('ttt')}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-black ${winner === 'X' ? 'text-emerald-500' : winner === 'O' ? 'text-red-500' : 'text-slate-500'}`}>{resultText}</span>
          <span className="text-[10px] font-black text-amber-500">连胜 {wins}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
          {board.map((c, i) => (
            <button
              key={i}
              onClick={() => play(i)}
              className={`h-16 text-2xl font-black border thin-border transition-colors bp-no-elevate ${
                c === 'X' ? 'bg-[#0033a0]/5 text-[#0033a0]' : c === 'O' ? 'bg-red-50 text-red-500' : 'bg-slate-50 hover:bg-slate-100 text-slate-200'
              }`}
            >
              {c || ''}
            </button>
          ))}
        </div>
        {(winner || board.every((v) => v)) && (
          <Button onClick={reset} className="w-full h-8 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[11px]">
            <RotateCcw className="w-3 h-3 mr-1" /> 再来一局
          </Button>
        )}
      </div>
    </GameCard>
  );
}

/* ============ 8. 2048 ============ */
function Game2048(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const [grid, setGrid] = useState<number[][]>(() => emptyGrid());
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  function emptyGrid(): number[][] {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  }

  const addTile = (g: number[][]) => {
    const empty: [number, number][] = [];
    g.forEach((row, r) => row.forEach((v, c) => v === 0 && empty.push([r, c])));
    if (empty.length === 0) return g;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
    return g;
  };

  const slide = (row: number[]) => {
    const vals = row.filter((v) => v !== 0);
    const out: number[] = [];
    let gained = 0;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) {
        out.push(vals[i] * 2);
        gained += vals[i] * 2;
        i++;
      } else {
        out.push(vals[i]);
      }
    }
    while (out.length < 4) out.push(0);
    return { out, gained };
  };

  const move = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (over) return;
    let changed = false;
    let gained = 0;
    const g = grid.map((r) => [...r]);

    const operate = (idx: number, getRow: (i: number) => number[], setRow: (i: number, r: number[]) => void) => {
      const row = getRow(idx);
      const dirRow = dir === 'right' || dir === 'down' ? [...row].reverse() : row;
      const { out, gained: g2 } = slide(dirRow);
      const final = dir === 'right' || dir === 'down' ? out.reverse() : out;
      gained += g2;
      if (final.some((v, i) => v !== row[i])) changed = true;
      setRow(idx, final);
    };

    for (let i = 0; i < 4; i++) {
      if (dir === 'left' || dir === 'right') {
        operate(i, (r) => g[r], (r, row) => { g[r] = row; });
      } else {
        operate(i, (c) => g.map((r) => r[c]), (c, col) => { g.forEach((r, ri) => { r[c] = col[ri]; }); });
      }
    }

    if (changed) {
      addTile(g);
      setGrid(g);
      setScore((s) => s + gained);
      if (gained > 0) setGameScore('2048', score + gained);
      if (g.every((r) => r.every((v) => v !== 0))) {
        // 检查是否还能动
        let movable = false;
        for (let r = 0; r < 4 && !movable; r++) {
          for (let c = 0; c < 4 && !movable; c++) {
            if (c < 3 && g[r][c] === g[r][c + 1]) movable = true;
            if (r < 3 && g[r][c] === g[r + 1][c]) movable = true;
          }
        }
        if (!movable) setOver(true);
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        move(d);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, over]);

  const reset = () => {
    let g = emptyGrid();
    g = addTile(g);
    g = addTile(g);
    setGrid(g);
    setScore(0);
    setOver(false);
  };

  const tileColor = (v: number) => {
    const map: Record<number, string> = {
      2: 'bg-slate-50 text-slate-600', 4: 'bg-slate-100 text-slate-600',
      8: 'bg-[#0033a0]/20 text-[#0033a0]', 16: 'bg-[#0033a0]/40 text-white',
      32: 'bg-[#0033a0]/60 text-white', 64: 'bg-[#0033a0] text-white',
      128: 'bg-amber-400 text-white', 256: 'bg-amber-500 text-white',
      512: 'bg-orange-500 text-white', 1024: 'bg-orange-600 text-white', 2048: 'bg-red-500 text-white',
    };
    return map[v] || 'bg-slate-800 text-white';
  };

  return (
    <GameCard {...props} title="2048" emoji="🀄" desc="方向键/按钮滑动合并数字" best={gameBest('2048')}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-600">得分 {score}</span>
          {over && <span className="text-[11px] font-black text-red-500">💀 没有可移动的了</span>}
          <div className="flex gap-1">
            {(['left', 'up', 'down', 'right'] as const).map((d) => (
              <button key={d} onClick={() => move(d)} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-500 bp-no-elevate">
                {d === 'left' ? '←' : d === 'right' ? '→' : d === 'up' ? '↑' : '↓'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 max-w-[240px] mx-auto">
          {grid.flat().map((v, i) => (
            <div key={i} className={`h-14 flex items-center justify-center text-lg font-black transition-all ${v ? tileColor(v) : 'bg-white/60 text-transparent'}`}>
              {v || ''}
            </div>
          ))}
        </div>
        <Button onClick={reset} className="w-full h-8 bg-[#0033a0] hover:bg-[#002580] rounded-none text-[11px]">
          <RotateCcw className="w-3 h-3 mr-1" /> 重新开始
        </Button>
      </div>
    </GameCard>
  );
}

/* ============ 9. 五子棋（15x15 人机） ============ */
const GOMOKU_SIZE = 15;

function GomokuGame(props: { zoomed?: boolean; onZoom?: () => void } = {}) {
  const { gameBest, setGameScore } = useGame();
  const [board, setBoard] = useState<number[][]>(() => Array.from({ length: GOMOKU_SIZE }, () => Array(GOMOKU_SIZE).fill(0)));
  const [turn, setTurn] = useState<1 | 2>(1);
  const [winner, setWinner] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [wins, setWins] = useState(0);

  const checkWin = (b: number[][], r: number, c: number, player: number) => {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= GOMOKU_SIZE || nc < 0 || nc >= GOMOKU_SIZE || b[nr][nc] !== player) break;
        count++;
      }
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i, nc = c - dc * i;
        if (nr < 0 || nr >= GOMOKU_SIZE || nc < 0 || nc >= GOMOKU_SIZE || b[nr][nc] !== player) break;
        count++;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  const scorePoint = (b: number[][], r: number, c: number, player: number) => {
    if (b[r][c] !== 0) return 0;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let score = 0;
    for (const [dr, dc] of dirs) {
      let count = 1;
      let open = 0;
      for (const step of [1, -1]) {
        let blocked = false;
        let first = true;
        for (let i = 1; i < 5; i++) {
          const nr = r + dr * step * i, nc = c + dc * step * i;
          if (nr < 0 || nr >= GOMOKU_SIZE || nc < 0 || nc >= GOMOKU_SIZE) { blocked = true; break; }
          if (b[nr][nc] === player) count++;
          else if (b[nr][nc] === 0) { if (first) open++; break; }
          else { blocked = true; break; }
        }
        if (blocked && first) open--;
      }
      const weights: Record<number, number> = { 5: 100000, 4: 10000, 3: 1000, 2: 100, 1: 10 };
      score += (weights[count] || 0) * (open > 0 ? 2 : 1);
    }
    return score;
  };

  const aiMove = (b: number[][]) => {
    let best = -1;
    let bestR = 7, bestC = 7;
    for (let r = 0; r < GOMOKU_SIZE; r++) {
      for (let c = 0; c < GOMOKU_SIZE; c++) {
        if (b[r][c] !== 0) continue;
        const attack = scorePoint(b, r, c, 2);
        const defend = scorePoint(b, r, c, 1);
        const total = attack + defend * 0.9;
        if (total > best) {
          best = total;
          bestR = r;
          bestC = c;
        }
      }
    }
    return [bestR, bestC];
  };

  const place = (r: number, c: number) => {
    if (winner || thinking || board[r][c] !== 0) return;
    const next = board.map((row) => [...row]);
    next[r][c] = 1;
    setBoard(next);
    if (checkWin(next, r, c, 1)) {
      setWinner(1);
      const w = wins + 1;
      setWins(w);
      if (w > gameBest('gomoku')) {
        setGameScore('gomoku', w);
        toast.success(`🎉 你赢了！连胜 ${w} 局，新纪录！`);
      } else {
        toast.success('🎉 你赢了！');
      }
      return;
    }
    setTurn(2);
    setThinking(true);
    setTimeout(() => {
      const [ar, ac] = aiMove(next);
      const after = next.map((row) => [...row]);
      after[ar][ac] = 2;
      setBoard(after);
      if (checkWin(after, ar, ac, 2)) {
        setWinner(2);
        toast.info('🤖 电脑赢了，再来一局？');
        return;
      }
      setTurn(1);
      setThinking(false);
    }, 200);
  };

  const reset = () => {
    setBoard(Array.from({ length: GOMOKU_SIZE }, () => Array(GOMOKU_SIZE).fill(0)));
    setTurn(1);
    setWinner(0);
    setThinking(false);
  };

  return (
    <GameCard {...props} title="五子棋" emoji="⚫" desc="15x15 人机对战（AI 会防守和进攻）" best={gameBest('gomoku')}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold text-slate-600">
          {winner === 0 ? (turn === 1 ? '🟢 轮到你（黑）' : `🤖 电脑思考中${thinking ? '...' : ''}`) : winner === 1 ? '🎉 你赢了！' : '🤖 电脑赢了'}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-amber-500">连胜 {wins}</span>
          <button onClick={reset} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-black rounded-none bp-no-elevate">
            重开
          </button>
        </div>
      </div>
      <div className="select-none" style={{ width: '100%', maxWidth: 340, aspectRatio: '1' }}>
        <div className="grid w-full h-full relative" style={{ gridTemplateColumns: `repeat(${GOMOKU_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GOMOKU_SIZE}, 1fr)` }}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className="relative bg-amber-100/60" style={{ borderRight: c < GOMOKU_SIZE - 1 ? '1px solid #d6b36a' : 'none', borderBottom: r < GOMOKU_SIZE - 1 ? '1px solid #d6b36a' : 'none' }}>
                {cell !== 0 && (
                  <div
                    className={`absolute rounded-full ${cell === 1 ? 'bg-slate-900' : 'bg-white border border-slate-300'}`}
                    style={{ inset: '12%', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  />
                )}
                {cell === 0 && (
                  <button onClick={() => place(r, c)} className="absolute inset-0 hover:bg-black/5" aria-label={`落子 ${r},${c}`} />
                )}
              </div>
            )),
          )}
        </div>
      </div>
    </GameCard>
  );
}

/* ============ 游戏厅入口 ============ */

export default function GamesSection() {
  const [extGame, setExtGame] = useState('');
  const [zoomed, setZoomed] = useState<string | null>(null);
  const zoomProps = (id: string) => ({
    zoomed: zoomed === id,
    onZoom: () => setZoomed((z) => (z === id ? null : id)),
  });
  const zoomClass = (id: string) => (zoomed === id ? 'md:col-span-2 xl:col-span-3' : '');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <motion.div className={zoomClass('snake')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <SnakeGame {...zoomProps('snake')} />
      </motion.div>
      <motion.div className={zoomClass('rps')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        <RpsGame {...zoomProps('rps')} />
      </motion.div>
      <motion.div className={zoomClass('guess')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <GuessGame {...zoomProps('guess')} />
      </motion.div>
      <motion.div className={zoomClass('whack')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <WhackGame {...zoomProps('whack')} />
      </motion.div>
      <motion.div className={zoomClass('memo')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <MemoGame {...zoomProps('memo')} />
      </motion.div>
      <motion.div className={zoomClass('reaction')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
        <ReactionGame {...zoomProps('reaction')} />
      </motion.div>
      <motion.div className={zoomClass('tictactoe')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <TicTacToeGame {...zoomProps('tictactoe')} />
      </motion.div>
      <motion.div className={zoomClass('g2048')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
        <Game2048 {...zoomProps('g2048')} />
      </motion.div>
      <motion.div className={zoomClass('gomoku')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
        <GomokuGame {...zoomProps('gomoku')} />
      </motion.div>

      {/* ============ GitHub 开源游戏合集 ============ */}
      <div className="report-card p-6 md:col-span-2 xl:col-span-3">
        <div className="section-label mb-1">🕹️ GitHub 开源游戏合集</div>
        <div className="section-subtitle mb-4">从 GitHub 精选的开源小游戏（克隆自 github.com，点击即可游玩）</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {[
            { path: '/tools/2048/', name: '2048', desc: '合并数字到 2048', emoji: '🔢', stars: '★120k' },
            { path: '/tools/minesweeper/', name: '扫雷', desc: '纯 CSS 实现的扫雷', emoji: '💣', stars: '★856' },
            { path: '/tools/tetris/', name: '俄罗斯方块', desc: '经典下落方块', emoji: '🧱', stars: '★732' },
            { path: '/tools/sudoku/', name: '数独', desc: '9x9 逻辑推理', emoji: '🧩', stars: '★495' },
            { path: '/tools/snake/', name: '贪吃蛇', desc: '像素风经典贪吃蛇', emoji: '🐍', stars: '★594' },
            { path: '/tools/memory/', name: '记忆翻牌', desc: '翻牌配对挑战', emoji: '🃏', stars: '★513' },
            { path: '/tools/life/', name: '生命游戏', desc: '康威生命模拟器', emoji: '🧬', stars: '★436' },
          ].map((g) => (
            <button
              key={g.path}
              onClick={() => setExtGame(g.path)}
              className={`p-4 border thin-border text-center transition-all bp-no-elevate ${extGame === g.path ? 'bg-[#0033a0]/5 border-[#0033a0]' : 'bg-slate-50 hover:bg-slate-100'}`}
            >
              <div className="text-2xl mb-1.5">{g.emoji}</div>
              <div className="text-[12px] font-black text-slate-800">{g.name}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{g.desc}</div>
              <div className="text-[8px] font-bold text-amber-500 mt-1">{g.stars}</div>
            </button>
          ))}
        </div>
        {extGame && (
          <div className="border thin-border overflow-hidden">
            <div className="flex items-center gap-2 p-2 bg-slate-50 thin-border-b">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">正在游玩</span>
              <span className="text-[10px] font-bold text-[#0033a0]">{extGame}</span>
              <button
                onClick={() => window.open(extGame, '_blank')}
                className="ml-auto px-2.5 py-1 bg-[#0033a0] hover:bg-[#002580] text-white text-[9px] font-black uppercase tracking-wider"
              >
                全屏 ↗
              </button>
            </div>
            <iframe key={extGame} src={extGame} title="开源游戏" className="w-full border-0 bg-white" style={{ height: '560px' }} loading="lazy" />
          </div>
        )}
      </div>
    </div>
  );
}
