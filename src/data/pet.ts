// 宠物养成系统：纯推导（零存储），基于任务/积分数据实时计算
// 喂食=完成任务，连续不喂会饿，饿狠了威胁离家出走
import { type ITask } from './game';

export interface PetState {
  level: number; // 1-50
  stage: number; // 0=蛋 1=幼崽 2=成长 3=完全体
  emoji: string;
  name: string;
  fedToday: boolean;
  hungryDays: number; // 连续没任务的天数（0=今天喂过）
  mood: 'happy' | 'ok' | 'hungry' | 'critical';
  say: string; // 当前心情文案
  progressText: string; // 下一阶段提示
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const STAGE_NAMES = [
  ['沉睡の蛋', '神秘の蛋', '待孵化の蛋'],
  ['小叽', '蛋黄', '糯米团'],
  ['毛球', '旋风', '炸毛'],
  ['风暴之鹰', '苍穹霸主', '九天玄鸟'],
];
const STAGE_EMOJIS = ['🥚', '🐣', '🐥', '🦅'];
const STAGE_LABELS = ['蛋', '幼崽', '成长体', '完全体'];

const SAY_HAPPY = [
  '吃饱了，今天的我也很可爱！',
  '叽！你完成任务的样子真帅！',
  '主人今天超棒的，奖励我一根呆毛！',
  '翅膀扑棱扑棱，为你打 call！',
  '记录显示你是个靠谱的人类，批准！',
];
const SAY_OK = [
  '今天还没开饭吗…我还能撑一会。',
  '主人，任务表上怎么空空如也？',
  '我闻到了…摸鱼的味道。',
];
const SAY_HUNGRY = [
  '饿了两天！再这样我要吃你的作业本！',
  '咕噜咕噜…这是肚子叫，不是我在说话。',
  '你的任务呢？我的饭呢？双输！',
];
const SAY_CRITICAL = [
  '⚠️ 三天没喂了！我正在收拾小包袱…',
  '最后通牒：再不来任务，我就去隔壁主人那了！',
  '已购买离家出走机票，目的地：未知。',
];

export function computePetState(
  progress: { totalPoints: number },
  tasks: ITask[],
): PetState {
  const level = Math.min(50, Math.floor(progress.totalPoints / 60) + 1);
  const stage = level >= 25 ? 3 : level >= 12 ? 2 : level >= 4 ? 1 : 0;

  const today = fmtDate(Date.now());
  const seed = hashStr(`${today}-${progress.totalPoints}`);
  const pick = (arr: string[]) => arr[seed % arr.length];

  // 最近喂食日期与饥饿天数
  let lastFed = '';
  let maxTs = 0;
  for (const t of tasks) {
    if (t.completedAt > maxTs) {
      maxTs = t.completedAt;
      lastFed = fmtDate(t.completedAt);
    }
  }

  // 全新账号（从未完成任务）：等待孵化，不显示饥饿
  if (!lastFed) {
    return {
      level,
      stage,
      emoji: STAGE_EMOJIS[stage],
      name: pick(STAGE_NAMES[stage]),
      fedToday: false,
      hungryDays: 0,
      mood: 'ok',
      say: '我是你的任务宠物，完成第一个任务我就会破壳而出！',
      progressText: `再攒 ${Math.max(0, 4 * 60 - progress.totalPoints)} 积分破壳`,
    };
  }

  let hungryDays = 0;
  {
    const diff = Math.round((Date.now() - maxTs) / 86400000);
    hungryDays = Math.max(0, diff);
    if (fmtDate(maxTs) === today) hungryDays = 0;
  }

  const fedToday = hungryDays === 0 && lastFed !== '';

  let mood: PetState['mood'];
  let say: string;
  if (hungryDays >= 3) {
    mood = 'critical';
    say = pick(SAY_CRITICAL);
  } else if (hungryDays === 2) {
    mood = 'hungry';
    say = pick(SAY_HUNGRY);
  } else if (hungryDays === 1) {
    mood = 'hungry';
    say = pick(SAY_OK);
  } else if (fedToday) {
    mood = 'happy';
    say = pick(SAY_HAPPY);
  } else {
    // 空号：还没孵化
    mood = 'ok';
    say = '我是你的任务宠物，完成第一个任务我就会破壳而出！';
  }

  // 下一阶段提示
  let progressText: string;
  if (stage === 0) {
    progressText = `再攒 ${Math.max(0, 4 * 60 - progress.totalPoints)} 积分破壳`;
  } else if (stage === 1) {
    progressText = `再攒 ${Math.max(0, 12 * 60 - progress.totalPoints)} 积分成长为 ${STAGE_NAMES[2][0]}`;
  } else if (stage === 2) {
    progressText = `再攒 ${Math.max(0, 25 * 60 - progress.totalPoints)} 积分进化成 ${STAGE_NAMES[3][0]}`;
  } else {
    progressText = '已是完全体，传说の存在';
  }

  return {
    level,
    stage,
    emoji: STAGE_EMOJIS[stage],
    name: pick(STAGE_NAMES[stage]),
    fedToday,
    hungryDays,
    mood,
    say,
    progressText,
  };
}

export const PET_STAGE_LABELS = STAGE_LABELS;
