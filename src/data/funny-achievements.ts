// 搞笑成就引擎：根据任务名称关键词 / 类型 / 难度 / 完成时段 / 里程碑
// 生成幽默成就称号与吐槽文案（纯前端规则引擎，确定性离线可用）
import { type ITask, type TaskType, type TaskDifficulty } from './game';

export interface IFunnyResult {
  title: string;
  comment: string;
  emoji: string;
}

interface IRule {
  match: RegExp;
  emoji: string;
  titles: string[];
  comments: string[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============ 任务名关键词规则（优先级最高，命中即用） ============
const KEYWORD_RULES: IRule[] = [
  // —— 学习类 ——
  {
    match: /背单词|单词|英语|abandon/i,
    emoji: '📖',
    titles: ['词汇量の暴徒', 'Abandon 复仇者', '单词刺客', '词典搬运工'],
    comments: [
      '从 abandon 开始，终于背到了 abandon 之后，进步巨大。',
      '今天背的单词，够在英语角吹十分钟了。',
      '你背单词的样子，像极了囤货的仓鼠。',
    ],
  },
  {
    match: /阅读|读书|看书|名著|小说/i,
    emoji: '📚',
    titles: ['书页收割机', '人类高质量读书人', '图书馆钉子户'],
    comments: [
      '书页翻得比翻脸还快，内容记住了吗？无所谓，气质上来了。',
      '今天也是精神食粮管够的一天，就是不知道消化没。',
      '读万卷书行万里路，你已经在路上了(字面意思，指书架)。',
    ],
  },
  {
    match: /学习|复习|备考|考试|刷题|做题/i,
    emoji: '✍️',
    titles: ['学海钉子户', '知识吸收怪', '卷王本王'],
    comments: [
      '别人在刷短视频，你在刷题，格局一下就打开了。',
      '知识它不进脑子？没关系，先进任务列表。',
      '今天的学习量，够发十篇小红书了。',
    ],
  },
  {
    match: /编程|代码|写码|程序|bug|改bug|debug/i,
    emoji: '💻',
    titles: ['代码奶牛', 'Bug 消灭者', '秃头预备役', 'Ctrl+S 战神'],
    comments: [
      '写代码一时爽，一直写一直爽，头发表示有意见。',
      '你消灭的 bug 比消灭的蚊子还多。',
      '这个任务完成后，建议给头发买份保险。',
    ],
  },
  {
    match: /网课|课程|视频课|慕课|教程/i,
    emoji: '🎓',
    titles: ['网课钉子户', '倍速学习大师'],
    comments: [
      '2 倍速听完，等于听了两遍，逻辑闭环了。',
      '网课进度条走得比你的耐心还快。',
    ],
  },
  {
    match: /论文|写作|文章|报告/i,
    emoji: '🖋️',
    titles: ['文字生产线', '键盘侠(褒义)'],
    comments: [
      '每个字都像是从键盘上挤出来的，辛苦了。',
      '写出来的字连起来，大概能绕键盘三圈。',
    ],
  },
  // —— 工作类 ——
  {
    match: /加班/i,
    emoji: '🌙',
    titles: ['加班の神', '工位雕塑家'],
    comments: [
      '公司没给你发加班费，但系统给你发了成就，也算一种补偿。',
      '别人下班是回家，你下班是换个地方上班。',
    ],
  },
  {
    match: /周报|日报|月报|总结/i,
    emoji: '📋',
    titles: ['周报缝合怪', '总结小能手'],
    comments: [
      '把 5 分钟的工作写成 500 字的成果，也是一种才华。',
      '周报写得比实际工作精彩，建议转行当作家。',
    ],
  },
  {
    match: /开会|会议|例会/i,
    emoji: '🗣️',
    titles: ['会议室常驻嘉宾', 'PPT 鉴赏家'],
    comments: [
      '会上说的都对，散会之后…大家心照不宣。',
      '你开过的会，比吃过的饭还多。',
    ],
  },
  {
    match: /方案|需求|项目|对接|沟通/i,
    emoji: '🤝',
    titles: ['需求消化大师', '项目推进器'],
    comments: [
      '需求改了三版，你还能心平气和，真·情绪管理大师。',
      '把「再改一下」听成「做得真好」，是职场必备技能。',
    ],
  },
  // —— 运动类 ——
  {
    match: /跑步|慢跑|晨跑|夜跑/i,
    emoji: '🏃',
    titles: ['风一样的男子/女子', '跑得比外卖快', '多巴胺充值成功'],
    comments: [
      '跑完 5 公里，你比外卖小哥还快。',
      '今天的多巴胺已经充值，快乐余额 +999。',
      '别人跑的是步，你跑的是自律的人设。',
    ],
  },
  {
    match: /健身|撸铁|力量|增肌|举铁/i,
    emoji: '🏋️',
    titles: ['铁馆钉子户', '肌肉铸造师'],
    comments: [
      '撸铁一时爽，明天起床…更爽(才怪)。',
      '你的肱二头肌在向你敬礼。',
    ],
  },
  {
    match: /游泳/i,
    emoji: '🏊',
    titles: ['浪里白条', '泳池飞鱼'],
    comments: ['下水那一刻，你已经是泳池最靓的仔。'],
  },
  {
    match: /瑜伽|拉伸|冥想/i,
    emoji: '🧘',
    titles: ['柔软の哲学家', '身心合一大师'],
    comments: ['拉伸的不只是身体，还有你紧绷的神经。'],
  },
  {
    match: /跳绳|打球|篮球|足球|羽毛球|乒乓/i,
    emoji: '⚽',
    titles: ['球类全能王', '运动场追风少年'],
    comments: ['球场上你挥洒的汗水，比键盘上的口水多。'],
  },
  // —— 生活类 ——
  {
    match: /做饭|做菜|烹饪|下厨|炒菜|煮/i,
    emoji: '🍳',
    titles: ['中华小当家(自封)', '厨房冒险家', '黑暗料理终结者'],
    comments: [
      '今天没把厨房炸了，就已经是胜利。',
      '你做的饭，连狗都…等等，狗吃了两碗。',
      '厨艺好不好不重要，摆盘好看就赢了。',
    ],
  },
  {
    match: /打扫|扫地|拖地|清洁|大扫除/i,
    emoji: '🧹',
    titles: ['扫地僧の传人', '灰尘歼灭者'],
    comments: ['扫完的地板亮得能当镜子，照出你勤劳的身影。'],
  },
  {
    match: /整理|收纳|收拾|叠/i,
    emoji: '🗂️',
    titles: ['收纳魔法师', '断舍离の践行者'],
    comments: ['整理完的房间，比你的心情还整洁。'],
  },
  {
    match: /早睡|早起|作息|睡觉/i,
    emoji: '🛏️',
    titles: ['早睡星人', '作息标兵'],
    comments: ['今天早睡，明天就是全村起得最早的人。'],
  },
  {
    match: /洗碗|洗衣|家务/i,
    emoji: '🧺',
    titles: ['家务全能手', '生活委员'],
    comments: ['家务干得比工作还认真，建议转行家政(开玩笑)。'],
  },
  {
    match: /购物|买菜|采购/i,
    emoji: '🛒',
    titles: ['采购小达人', '精打细算の王'],
    comments: ['买完菜记得算账，算不明白就当锻炼数学了。'],
  },
  // —— 其他 ——
  {
    match: /游戏|通关|上分|排位/i,
    emoji: '🎮',
    titles: ['游戏人生家', '电子竞技乐观选手'],
    comments: ['把游戏当任务完成，你是懂时间管理的。'],
  },
  {
    match: /电影|追剧|综艺/i,
    emoji: '🎬',
    titles: ['追剧达人', '影视鉴赏家'],
    comments: ['看完这一集就睡，结果又看了一集，我懂。'],
  },
  {
    match: /冥想|发呆|休息|放松|睡觉|午休/i,
    emoji: '😴',
    titles: ['休息の艺术家', '摸鱼大师(养生版)'],
    comments: ['会休息的人才会工作，你已经是理论大师了。'],
  },
];

// ============ 类型兜底规则 ============
const TYPE_RULES: Record<TaskType, IRule> = {
  study: {
    match: /./,
    emoji: '📚',
    titles: ['今天也是爱学习的一天呢', '知识搬运工', '学海无涯回头是岸(不回头)'],
    comments: ['学习使人快乐，不学习使人快乐(指摸鱼)，你选了前者，格局打开。'],
  },
  work: {
    match: /./,
    emoji: '💼',
    titles: ['打工人の自我修养', '工位守护神', '职场卷心菜'],
    comments: ['打工人打工魂，打工都是人上人，今天也是元气满满的一天呢。'],
  },
  sport: {
    match: /./,
    emoji: '🏃',
    titles: ['多巴胺收割机', '动起来の奇迹'],
    comments: ['运动一时爽，一直运动一直爽，明天腿酸别找我。'],
  },
  life: {
    match: /./,
    emoji: '🏠',
    titles: ['生活小能手', '居家过日子の神'],
    comments: ['把生活过成诗，把任务记成册，你是懂生活的。'],
  },
  other: {
    match: /./,
    emoji: '✨',
    titles: ['神秘任务执行者', '跨界の勇者'],
    comments: ['这个任务看起来不太一般，但你还是完成了，respect。'],
  },
};

// ============ 难度补丁文案 ============
const DIFFICULTY_COMMENTS: Record<TaskDifficulty, string[]> = {
  easy: [
    '简单任务也认真完成，这种态度值得表扬(虽然确实简单)。',
    '轻松拿捏，甚至还有余力再卷一个。',
    '小菜一碟，碟子还给你擦干净了。',
  ],
  medium: [
    '中等难度？在你面前也就中等偏下。',
    '稳稳拿下，不慌不忙，这就是老手的从容。',
    '这种任务对你来说，就是热身运动。',
  ],
  hard: [
    '困难任务都被你拿下了，建议直接封神。',
    '勇士，真正的勇士，敢于直面困难的任务。',
    '这么难的任务你都完成了，下次敢不敢更难一点？',
  ],
};

// ============ 时段规则 ============
function timeRule(hour: number): { emoji: string; title: string; comment: string } | null {
  if (hour >= 0 && hour < 5) {
    return {
      emoji: '🦉',
      title: '夜猫子修仙中',
      comment: '凌晨还在完成任务？你是修仙界流落在外的传人吧。',
    };
  }
  if (hour >= 5 && hour < 8) {
    return {
      emoji: '🐦',
      title: '早起鸟の倔强',
      comment: '这么早就完成任务，太阳都还没完全起床呢。',
    };
  }
  if (hour >= 22) {
    return {
      emoji: '🌃',
      title: '深夜肝帝降临',
      comment: '深夜完成任务，白天的时间都用来…睡了？',
    };
  }
  return null;
}

// ============ 里程碑规则（在关键词/类型之后追加，可叠加） ============
function milestoneRules(ctx: {
  totalTasks: number;
  streakDays: number;
  dailyTaskCount: number;
}): { emoji: string; title: string; comment: string }[] {
  const list: { emoji: string; title: string; comment: string }[] = [];
  if (ctx.totalTasks === 1) {
    list.push({
      emoji: '🎯',
      title: '首杀成就达成',
      comment: '第一个任务完成！万事开头难，后面…也难，但开头最重要。',
    });
  }
  if (ctx.totalTasks === 10) {
    list.push({
      emoji: '🏅',
      title: '两位数俱乐部会员',
      comment: '累计 10 个任务，你已经是个成熟的打卡人了。',
    });
  }
  if (ctx.streakDays >= 3 && ctx.streakDays <= 5) {
    list.push({
      emoji: '🔥',
      title: '连续打卡小马达',
      comment: `连续 ${ctx.streakDays} 天，闹钟都没你准时。`,
    });
  }
  if (ctx.streakDays >= 7) {
    list.push({
      emoji: '⚡',
      title: '自律の怪物',
      comment: `连续 ${ctx.streakDays} 天完成任务，建议申报非遗。`,
    });
  }
  if (ctx.dailyTaskCount >= 10) {
    list.push({
      emoji: '🏭',
      title: '任务流水线厂主',
      comment: `今天第 ${ctx.dailyTaskCount} 个任务，效率高得有点可疑。`,
    });
  } else if (ctx.dailyTaskCount >= 5) {
    list.push({
      emoji: '🚀',
      title: '今日效率卷王',
      comment: `今天第 ${ctx.dailyTaskCount} 个任务，别人一天的量你半天干完了。`,
    });
  }
  return list;
}

// ============ 通用兜底池 ============
const GENERIC_POOL: { emoji: string; title: string; comment: string }[] = [
  { emoji: '😎', title: '任务终结者', comment: '又一个任务倒在你脚下，下一个。' },
  { emoji: '🦸', title: '超级任务人', comment: '你完成任务的姿势，帅得有点犯规。' },
  { emoji: '🧠', title: '脑力担当', comment: '这个任务用掉的脑细胞，够开一家公司了。' },
  { emoji: '🐢', title: '慢工出细活の神', comment: '任务完成得稳，就像乌龟赛跑，赢了就是赢了。' },
  { emoji: '⚙️', title: '全能执行引擎', comment: '输入任务，输出完成，你就是一台人形执行机。' },
  { emoji: '🌱', title: '成长中的卷心菜', comment: '每完成一个任务，你就长高 1 毫米(精神层面)。' },
  { emoji: '🎪', title: '杂技演员', comment: '在任务之间来回切换还不晕，佩服。' },
  { emoji: '🏆', title: '奖杯收集狂', comment: '又拿下一个，你的成就墙快不够贴了。' },
  { emoji: '🤖', title: '人形自律机器人', comment: '检测到自律值超标，建议人工干预(不用)。' },
  { emoji: '🐝', title: '勤劳小蜜蜂', comment: '嗡嗡嗡，完成任务，嗡嗡嗡，继续干活。' },
  { emoji: '🧗', title: '任务攀登者', comment: '任务这座山，你爬一座平一座。' },
  { emoji: '🌊', title: '乘风破浪の打工人', comment: '任务如浪，你如冲浪板，稳稳拿捏。' },
  { emoji: '💫', title: '今日之星', comment: '今天的你，闪耀得像颗人形灯泡。' },
  { emoji: '🎯', title: '指哪打哪', comment: '任务指到哪，你就完成到哪，比 GPS 还准。' },
  { emoji: '🐉', title: '龙的传人(任务版)', comment: '任务在你面前，就像小泥鳅。' },
  { emoji: '🍀', title: '幸运执行者', comment: '任务顺利得不像话，今天宜完成。' },
  { emoji: '🛠️', title: '万能工具人', comment: '什么任务都能接，你就是传说中的六边形战士。' },
  { emoji: '🌟', title: '发光体', comment: '完成任务的样子在发光，小心闪到别人。' },
];

// ============ 主入口 ============
export function generateFunnyAchievement(
  task: ITask,
  ctx: { totalTasks: number; streakDays: number; dailyTaskCount: number },
): IFunnyResult {
  const hour = new Date(task.completedAt).getHours();

  // 1. 任务名关键词精准匹配
  const kwRule = KEYWORD_RULES.find((r) => r.match.test(task.name));
  if (kwRule) {
    return {
      emoji: kwRule.emoji,
      title: pick(kwRule.titles),
      comment: pick(kwRule.comments),
    };
  }

  // 2. 时段规则
  const time = timeRule(hour);
  if (time) {
    return {
      emoji: time.emoji,
      title: time.title,
      comment: time.comment,
    };
  }

  // 3. 类型兜底 + 难度补丁文案
  const typeRule = TYPE_RULES[task.type];
  const diffComment = pick(DIFFICULTY_COMMENTS[task.difficulty]);
  return {
    emoji: typeRule.emoji,
    title: pick(typeRule.titles),
    comment: Math.random() > 0.5 ? pick(typeRule.comments) : diffComment,
  };
}

/** 里程碑搞笑成就（与主成就并列追加，可叠加展示） */
export function generateMilestoneFunny(ctx: {
  totalTasks: number;
  streakDays: number;
  dailyTaskCount: number;
}): IFunnyResult[] {
  return milestoneRules(ctx);
}

// ============ 每日语录（按时段 + 数据动态） ============
const QUOTES_MORNING = [
  '早起的鸟儿有虫吃，早起的你有任务做(和虫子差不多命)。',
  '一日之计在于晨，一生之计在于…先把今天过了。',
  '早晨的咖啡是续命的，早上的任务是提神的。',
];
const QUOTES_DAY = [
  '完成一个任务，摸鱼的时间就多一分底气。',
  '任务不是生活的全部，但没任务的生活…好像更空虚？',
  '今天也要元气满满地完成任务，然后心安理得地躺平。',
  '拖延一时爽，一直拖延…任务就堆成山了，快动手。',
];
const QUOTES_NIGHT = [
  '白天摸的鱼，晚上都要用任务还的。',
  '晚上的效率才是真实力，白天那是演给老板看的。',
  '睡前完成一个任务，梦里都是成就解锁的声音。',
];
const QUOTES_LATENIGHT = [
  '凌晨还在完成任务？夜猫子认证，实锤了。',
  '这么晚还在努力，你是要感动中国吗？',
  '熬夜完成任务，小心头发有意见。',
];

export function getDailyQuote(progress: {
  totalTasks: number;
  streakDays: number;
  totalPoints: number;
  dailyTaskCount: number;
}): string {
  const hour = new Date().getHours();

  // 数据型语录优先
  if (progress.streakDays >= 7) {
    return `连续 ${progress.streakDays} 天打卡，自律得让人害怕，建议申请吉尼斯。`;
  }
  if (progress.streakDays >= 3) {
    return `连续 ${progress.streakDays} 天完成任务，再坚持一下就能召唤神龙了。`;
  }
  if (progress.totalTasks >= 100) {
    return `累计 ${progress.totalTasks} 个任务，你已经是任务界的扫地僧，深藏功与名。`;
  }
  if (progress.totalTasks >= 50) {
    return `累计 ${progress.totalTasks} 个任务，任务对你来说已经是家常便饭(和外卖一样)。`;
  }
  if (progress.totalPoints >= 1000) {
    return `积分破千！离人生赢家又近了一步(大概)。`;
  }
  if (progress.dailyTaskCount >= 5) {
    return `今天已完成 ${progress.dailyTaskCount} 个任务，效率高得可疑，建议抽查。`;
  }

  const pool =
    hour >= 5 && hour < 9
      ? QUOTES_MORNING
      : hour >= 22 || hour < 5
        ? hour >= 22 && hour < 24
          ? QUOTES_NIGHT
          : QUOTES_LATENIGHT
        : QUOTES_DAY;
  return pick(pool);
}

// ============ 今日人设（基于统计数据） ============
export function getFunnyIdentity(progress: {
  taskCountsByType: Record<TaskType, number>;
  maxDailyTasks: number;
  totalTasks: number;
}): { emoji: string; label: string } {
  const { taskCountsByType, maxDailyTasks, totalTasks } = progress;
  if (totalTasks === 0) return { emoji: '🎒', label: '任务新手村村民' };
  if (maxDailyTasks >= 10) return { emoji: '🏭', label: '任务流水线厂主' };
  if (maxDailyTasks >= 5) return { emoji: '⚡', label: '效率卷王' };

  const entries = Object.entries(taskCountsByType) as [TaskType, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const [topType, topCount] = sorted[0];
  if (topCount === 0) return { emoji: '🎒', label: '任务新手村村民' };

  const nonZero = entries.filter(([, c]) => c > 0).length;
  if (nonZero >= 4 && sorted[3][1] >= 5) return { emoji: '🌈', label: '斜杠青年' };

  switch (topType) {
    case 'study':
      return { emoji: '📚', label: '学海钉子户' };
    case 'work':
      return { emoji: '💼', label: '工位守护神' };
    case 'sport':
      return { emoji: '🏃', label: '多巴胺信徒' };
    case 'life':
      return { emoji: '🧹', label: '生活委员' };
    default:
      return { emoji: '✨', label: '神秘执行者' };
  }
}
