// 每日运势 + 节日/星期彩蛋（按日期做种子，当天固定不变）
export interface IFortune {
  rank: string; // 大吉/中吉/小吉/凶
  rankEmoji: string;
  rankColor: string;
  lucky: string[]; // 宜
  unlucky: string[]; // 忌
  comment: string;
}

export interface ISpecialDay {
  emoji: string;
  title: string;
  text: string;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const RANKS = [
  { rank: '大吉', rankEmoji: '🌟', rankColor: '#DC2626', comment: '今日诸事皆宜，连任务都排队来送积分。' },
  { rank: '中吉', rankEmoji: '👍', rankColor: '#EA580C', comment: '运势在线，完成任务的手感格外丝滑。' },
  { rank: '小吉', rankEmoji: '😌', rankColor: '#CA8A04', comment: '平稳的一天，适合默默把任务清完。' },
  { rank: '凶', rankEmoji: '🌧️', rankColor: '#64748B', comment: '今日不宜拖延，否则明天要用双倍时间还。' },
  { rank: '大凶', rankEmoji: '💀', rankColor: '#334155', comment: '大凶！但完成一个任务可以破凶化吉(迷信但有效)。' },
];

const LUCKY_POOL = [
  '学习', '运动', '早睡', '整理房间', '背单词', '阅读',
  '做一顿好饭', '大胆摸鱼', '列任务清单', '联系老朋友', '喝热水', '晒太阳',
];
const UNLUCKY_POOL = [
  '熬夜', '拖延', '暴饮暴食', '冲动消费', '刷短视频', '焦虑', '赖床', '吃土',
];

export function getFortune(dateStr: string, doneToday: boolean, totalTasks: number): IFortune {
  const seed = hashStr(dateStr);
  const rankIdx = seed % RANKS.length;
  const rank = RANKS[rankIdx];

  const lucky: string[] = [];
  const unlucky: string[] = [];
  for (let i = 0; i < 3; i++) {
    lucky.push(LUCKY_POOL[(seed + i * 7) % LUCKY_POOL.length]);
  }
  for (let i = 0; i < 2; i++) {
    unlucky.push(UNLUCKY_POOL[(seed + 3 + i * 5) % UNLUCKY_POOL.length]);
  }

  let comment = rank.comment;
  if (doneToday) {
    comment = totalTasks === 1
      ? `今日首单已完成，凶兆已破，剩下的都是赚的！`
      : `今日已喂饱宠物、完成任务，运势加成中，再接再厉！`;
  } else if (totalTasks > 0) {
    comment = `今日宜动手，昨日战绩不错，别让运势溜走。`;
  }

  return {
    rank: rank.rank,
    rankEmoji: rank.rankEmoji,
    rankColor: rank.rankColor,
    lucky,
    unlucky,
    comment,
  };
}

const FESTIVALS: { month: number; day: number; emoji: string; title: string; text: string }[] = [
  { month: 1, day: 1, emoji: '🎆', title: '元旦', text: '新年第一天的任务，是全年好运的开场白！' },
  { month: 2, day: 14, emoji: '💘', title: '情人节', text: '没有对象没关系，任务对象管够。' },
  { month: 3, day: 8, emoji: '🌸', title: '妇女节', text: '祝女神们任务全清、积分全收！' },
  { month: 4, day: 1, emoji: '🤡', title: '愚人节', text: '今天系统说的每句夸奖都是真的(大概)。' },
  { month: 5, day: 1, emoji: '🛠️', title: '劳动节', text: '劳动最光荣，今天完成任务格外有仪式感。' },
  { month: 6, day: 1, emoji: '🎈', title: '儿童节', text: '不管几岁，完成任务就是好孩子！' },
  { month: 9, day: 10, emoji: '🍎', title: '教师节', text: '今天也要好好完成「学习」类任务致敬老师。' },
  { month: 10, day: 1, emoji: '🎊', title: '国庆节', text: '七天长假，任务别欠账，假期才安心。' },
  { month: 12, day: 24, emoji: '🎄', title: '平安夜', text: '今晚平安，明天的任务明天再说。' },
  { month: 12, day: 25, emoji: '🎅', title: '圣诞节', text: '圣诞老人也羡慕你自律的样子。' },
];

export function getSpecialDay(): ISpecialDay | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const fest = FESTIVALS.find((f) => f.month === m && f.day === d);
  if (fest) {
    return { emoji: fest.emoji, title: fest.title, text: fest.text };
  }
  const wd = now.getDay(); // 0=周日
  const week: Record<number, ISpecialDay> = {
    0: { emoji: '⏰', title: '周日', text: '明天周一，今天的任务别欠到明天。' },
    1: { emoji: '🫠', title: '周一', text: '周一综合症预警：先完成一个小任务压压惊。' },
    2: { emoji: '📈', title: '周二', text: '周二了，本周任务进度条加载中…' },
    3: { emoji: '🏔️', title: '周三', text: '周三，一周的中点，任务量也该过半了。' },
    4: { emoji: '🌤️', title: '周四', text: '周四，黎明前的黑暗，坚持住。' },
    5: { emoji: '🎉', title: '周五', text: '周五啦，任务完成率决定周末质量！' },
    6: { emoji: '😎', title: '周六', text: '周末还在卷？真正的卷王就是你。' },
  };
  return week[wd];
}
