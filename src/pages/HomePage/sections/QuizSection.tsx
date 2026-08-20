import SubTabBar from '@/components/SubTabBar';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// ============ 通用：日期种子 ============
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// ============ 通用运势组件 ============
function HoroscopeTab({ emoji, title, signPool }: { emoji: string; title: string; signPool: { sign: string; text: string }[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [seed, setSeed] = useState(`${today}-${title}`);
  const s = signPool[hashStr(seed) % signPool.length];

  return (
    <div className="report-card p-8 text-center">
      <div className="text-4xl mb-3">{emoji}</div>
      <div className="section-label mb-1">{title}</div>
      <div className="section-subtitle mb-5">每日运势 · 仅供娱乐</div>
      <div className="inline-block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-8 py-6 mb-5">
        <div className="text-lg font-black text-amber-600 mb-2">{s.sign}</div>
        <div className="text-[13px] text-slate-700 max-w-md leading-relaxed">{s.text}</div>
      </div>
      <div>
        <Button onClick={() => setSeed(`${Date.now()}`)} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9 px-6">
          换一个
        </Button>
      </div>
      <div className="text-[9px] text-slate-300 mt-4">{today} · 每天第一签最准</div>
    </div>
  );
}

// ============ 通用小测试组件 ============
interface QuizQ { q: string; opts: string[]; score: number[] }
function QuizTab({ emoji, title, desc, questions, resultMap }: { emoji: string; title: string; desc: string; questions: QuizQ[]; resultMap: [number, string][] }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const total = questions.reduce((acc, q, i) => acc + (q.score[answers[i]] ?? 0), 0);
  const result = (() => {
    const sorted = [...resultMap].sort((a, b) => a[0] - b[0]);
    let r = sorted[0]?.[1] || '';
    for (const [min, text] of sorted) {
      if (total >= min) r = text;
    }
    return r;
  })();

  const reset = () => {
    setAnswers([]);
    setDone(false);
  };

  return (
    <div className="report-card p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{emoji}</div>
        <div className="section-label mb-1">{title}</div>
        <div className="section-subtitle">{desc}</div>
      </div>

      {!done ? (
        <div className="space-y-5">
          {questions.map((q, qi) => (
            <div key={qi} className="p-4 bg-slate-50 thin-border">
              <div className="text-[12px] font-black text-slate-700 mb-3">
                {qi + 1}. {q.q}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.opts.map((o, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => {
                      const next = [...a];
                      next[qi] = oi;
                      return next;
                    })}
                    className={`p-2.5 text-left text-[11px] font-bold border transition-colors bp-no-elevate ${
                      answers[qi] === oi ? 'bg-[#0033a0]/5 border-[#0033a0] text-[#0033a0]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button
            onClick={() => {
              if (answers.length < questions.length) {
                toast.info('还有题目没做完哦');
                return;
              }
              setDone(true);
            }}
            disabled={answers.length < questions.length}
            className="w-full bg-[#0033a0] hover:bg-[#002580] rounded-none h-10"
          >
            查看结果
          </Button>
        </div>
      ) : (
        <div className="text-center py-6">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">你的测试结果</div>
            <div className="text-2xl font-black text-[#0033a0] mb-3">{result}</div>
            <div className="text-[10px] text-slate-400">得分 {total}/{questions.reduce((a, q) => a + Math.max(...q.score), 0)}</div>
          </motion.div>
          <Button onClick={reset} className="mt-4 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none h-9">
            重新测试
          </Button>
        </div>
      )}
    </div>
  );
}

type QTab = 'xz' | 'sx' | 'xx' | 'tl' | 'jm' | 'xm' | 'xg' | 'ty' | 'yl' | 'lc' | 'sm' | 'xl' | 'gt' | 'zx' | 'xt';

const QTABS: { id: QTab; label: string; emoji: string }[] = [
  { id: 'xz', label: '星座运势', emoji: '♈' },
  { id: 'sx', label: '生肖运势', emoji: '🐲' },
  { id: 'xx', label: '血型性格', emoji: '🩸' },
  { id: 'tl', label: '塔罗牌', emoji: '🔮' },
  { id: 'jm', label: '周公解梦', emoji: '😴' },
  { id: 'xm', label: '姓名测试', emoji: '🪪' },
  { id: 'xg', label: '性格测试', emoji: '🧬' },
  { id: 'ty', label: '拖延测试', emoji: '🦥' },
  { id: 'yl', label: '压力测试', emoji: '🌋' },
  { id: 'lc', label: '理财测试', emoji: '💰' },
  { id: 'sm', label: '睡眠测试', emoji: '🛏️' },
  { id: 'xl', label: '效率测试', emoji: '⚡' },
  { id: 'gt', label: '沟通测试', emoji: '🗣️' },
  { id: 'zx', label: '执行力', emoji: '🏃' },
  { id: 'xt', label: '心态测试', emoji: '🧘' },
];

const SIGN_POOLS: Record<'xz' | 'sx' | 'xx' | 'tl' | 'jm' | 'xm', { sign: string; text: string }[]> = {
  xz: [
    { sign: '白羊座 ★★★★☆', text: '今天行动力爆棚，适合推进重要事项。别冲动消费，晚上早点休息。' },
    { sign: '金牛座 ★★★☆☆', text: '财运平稳，适合整理财务。工作中你的坚持会带来回报，耐心一点。' },
    { sign: '双子座 ★★★★☆', text: '社交运佳，交流中可能获得重要信息。注意别一心二用。' },
    { sign: '巨蟹座 ★★★☆☆', text: '家庭氛围温馨，适合陪伴家人。工作上稳扎稳打即可。' },
    { sign: '狮子座 ★★★★★', text: '气场全开的一天，适合展示自己。把握机会，你会是焦点。' },
    { sign: '处女座 ★★★☆☆', text: '细节决定成败，你的严谨今天很值钱。注意别太挑剔自己。' },
    { sign: '天秤座 ★★★★☆', text: '人缘极佳，适合合作与社交。感情上有小惊喜。' },
    { sign: '天蝎座 ★★★☆☆', text: '直觉敏锐，相信第一感觉。事业上有新机遇的苗头。' },
    { sign: '射手座 ★★★★☆', text: '适合出行和学习，新知识会带来新机遇。保持乐观。' },
    { sign: '摩羯座 ★★★☆☆', text: '工作运稳步上升，付出会有回报。注意劳逸结合。' },
    { sign: '水瓶座 ★★★★☆', text: '创意满满，适合头脑风暴。你的独特想法会被人赏识。' },
    { sign: '双鱼座 ★★★☆☆', text: '感性的一天，适合艺术创作。感情上多沟通少猜疑。' },
  ],
  sx: [
    { sign: '鼠 · 上签', text: '机灵应变的一天，遇到问题换个角度就能解决。' },
    { sign: '牛 · 中签', text: '踏实肯干有回报，但别太固执，听听别人建议。' },
    { sign: '虎 · 上签', text: '勇气可嘉，适合挑战新事物。注意细节别冲动。' },
    { sign: '兔 · 中签', text: '温柔待人会收获善意，今天适合修复关系。' },
    { sign: '龙 · 上上签', text: '气运正旺，重要的事今天办成功率很高！' },
    { sign: '蛇 · 中签', text: '沉着冷静是今天的法宝，观察后再行动。' },
    { sign: '马 · 中签', text: '活力充沛但容易急躁，慢一点反而更快。' },
    { sign: '羊 · 中签', text: '温和的一天，适合合作和团队工作。' },
    { sign: '猴 · 上签', text: '机智过人，难题到你手里都能化解。' },
    { sign: '鸡 · 中签', text: '守时守约带来好运气，细节处理到位。' },
    { sign: '狗 · 中签', text: '忠诚可靠被人信任，今天适合兑现承诺。' },
    { sign: '猪 · 上签', text: '福气满满，随遇而安反而有惊喜。' },
  ],
  xx: [
    { sign: 'A 型 · 认真派', text: '你严谨细致、责任心强，做事追求完美。适合做需要耐心的专业工作。注意：别对自己太苛刻。' },
    { sign: 'B 型 · 自由派', text: '你自由奔放、创意十足，喜欢按自己节奏生活。适合创意类工作。注意：多考虑他人感受。' },
    { sign: 'O 型 · 行动派', text: '你乐观自信、行动力强，是天生的领导者。适合挑战性工作。注意：急躁时先深呼吸。' },
    { sign: 'AB 型 · 理性派', text: '你理性冷静、思维独特，常常能跳出常规思考。适合分析和研究类工作。注意：适当表达情感。' },
  ],
  tl: [
    { sign: '愚者 THE FOOL', text: '新的开始，勇敢迈出第一步。未知并不可怕，可怕的是一直犹豫。' },
    { sign: '魔术师 THE MAGICIAN', text: '你拥有实现愿望的资源和能力，现在就是行动的时刻。' },
    { sign: '女祭司 THE HIGH PRIESTESS', text: '倾听内心直觉，答案就在你心里。静观其变。' },
    { sign: '皇后 THE EMPRESS', text: '丰盛与滋养的象征，用心经营会收获累累硕果。' },
    { sign: '皇帝 THE EMPEROR', text: '建立秩序，掌控局面。你需要果断和纪律。' },
    { sign: '恋人 THE LOVERS', text: '重要的选择或关系进展。跟随真心。' },
    { sign: '战车 THE CHARIOT', text: '意志坚定就能胜利。排除干扰，全力向前。' },
    { sign: '力量 STRENGTH', text: '真正的力量来自温柔与耐心。用爱化解困难。' },
    { sign: '隐士 THE HERMIT', text: '需要独处和思考。向内探索会找到答案。' },
    { sign: '命运之轮 WHEEL OF FORTUNE', text: '时来运转，把握当下的机遇。' },
    { sign: '正义 JUSTICE', text: '付出终有回报，诚实面对自己。' },
    { sign: '世界 THE WORLD', text: '圆满与完成，一个阶段即将收官。' },
  ],
  jm: [
    { sign: '梦见飞翔', text: '渴望自由与突破，潜意识告诉你该跳出舒适圈了。' },
    { sign: '梦见掉牙', text: '传统说法与成长焦虑有关，最近可能面临变化，放轻松。' },
    { sign: '梦见被追赶', text: '现实中有逃避的问题，勇敢面对它反而轻松。' },
    { sign: '梦见水', text: '情绪与潜意识的象征。清澈的水代表心境平和。' },
    { sign: '梦见考试', text: '对自己能力的检验焦虑，准备充分就不怕。' },
    { sign: '梦见迷路', text: '对方向感到迷茫，适合停下来重新规划。' },
    { sign: '梦见动物', text: '直觉与本能的呼唤，亲近自然能找回状态。' },
    { sign: '梦见高空坠落', text: '缺乏安全感的投射，最近注意休息和调整。' },
    { sign: '梦见故人', text: '对过去的怀念，也提醒你珍惜当下的人。' },
    { sign: '梦见捡钱', text: '好运的象征，但也要脚踏实地。' },
    { sign: '梦见上学', text: '求知欲与成长渴望，学习新技能的好时机。' },
    { sign: '梦见结婚', text: '新阶段的开始，代表承诺与转变。' },
  ],
  xm: [
    { sign: '笔画数 13-16 · 稳健型', text: '名字笔画适中的人性格沉稳，做事靠谱，值得信赖。' },
    { sign: '笔画数 17+ · 开拓型', text: '笔画多的名字带开拓气质，适合挑战和创新。' },
    { sign: '笔画数 9-12 · 灵动型', text: '笔画适中偏少的人思维灵活，反应快，社交能力强。' },
    { sign: '笔画数 ≤8 · 简约型', text: '名字简洁的人性格直爽，执行力强，不喜欢弯弯绕。' },
    { sign: '含五行之字 · 平衡型', text: '名字带五行属性的字，运势讲究平衡，注意劳逸结合。' },
    { sign: '重名率高 · 大众型', text: '名字常见不代表平凡，你的潜力在于不随波逐流。' },
  ],
};

const QUIZZES: Record<'xg' | 'ty' | 'yl' | 'lc' | 'sm' | 'xl' | 'gt' | 'zx' | 'xt', { desc: string; questions: QuizQ[]; resultMap: [number, string][] }> = {
  xg: {
    desc: '5 题快速了解你的性格底色',
    questions: [
      { q: '周末你更想怎么过？', opts: ['宅家休息', '和朋友聚会', '出门探索', '学习充电'], score: [1, 3, 4, 2] },
      { q: '面对突发状况，你的第一反应？', opts: ['慌', '冷静分析', '找别人帮忙', '直接行动'], score: [1, 4, 2, 3] },
      { q: '别人对你的评价更多是？', opts: ['靠谱', '有趣', '有想法', '温暖'], score: [3, 4, 2, 1] },
      { q: '做决定时你更依赖？', opts: ['理性', '直觉', '经验', '他人建议'], score: [3, 4, 2, 1] },
      { q: '你对新事物的态度？', opts: ['观望', '立即尝试', '研究后再试', '无所谓'], score: [1, 4, 3, 2] },
    ],
    resultMap: [
      [5, '🧸 稳重型：你是团队里的定海神针，情绪稳定，值得信赖'],
      [9, '🎭 平衡型：理性与感性兼顾，适应力强，人缘很好'],
      [13, '⚡ 行动型：想到就做，行动力是你的超能力'],
      [17, '🌟 冒险型：好奇心旺盛，你的生活永远不缺精彩'],
    ],
  },
  ty: {
    desc: '测测你的拖延指数',
    questions: [
      { q: '任务 deadline 前你通常？', opts: ['提前完成', '当天赶完', '拖到最后几小时', '总超时'], score: [1, 2, 3, 4] },
      { q: '"再刷五分钟手机"之后是？', opts: ['五分钟就停', '半小时', '一小时', '半天没了'], score: [1, 2, 3, 4] },
      { q: '你的书桌上/收藏夹里有多少"待做"？', opts: ['几乎没有', '几个', '一堆', '数不清'], score: [1, 2, 3, 4] },
      { q: '开始一件麻烦事时你会？', opts: ['直接开始', '先做简单的部分', '先列个计划', '先放一放'], score: [1, 2, 3, 4] },
      { q: '别人催你时你？', opts: ['马上行动', '有点烦但会做', '更想拖', '直接摆烂'], score: [1, 2, 3, 4] },
    ],
    resultMap: [
      [5, '🏅 行动派：你几乎不拖延，继续保持！'],
      [10, '😊 轻微拖延：偶尔拖一下无伤大雅，注意 deadline 就好'],
      [15, '😅 中度拖延：建议把大任务拆小，从 5 分钟开始'],
      [20, '🦥 重度拖延：先别测了，去把最要紧的事做掉 5 分钟！'],
    ],
  },
  yl: {
    desc: '你的压力指数有多高？',
    questions: [
      { q: '最近一个月你失眠的频率？', opts: ['没有', '偶尔', '经常', '几乎每天'], score: [1, 2, 3, 4] },
      { q: '你会莫名烦躁或想发火吗？', opts: ['很少', '偶尔', '经常', '天天'], score: [1, 2, 3, 4] },
      { q: '你对目前的工作/学习状态？', opts: ['满意', '还行', '不满意', '想逃离'], score: [1, 2, 3, 4] },
      { q: '你的身体最近？', opts: ['棒棒哒', '有点累', '肩膀脖子酸痛', '各种小毛病'], score: [1, 2, 3, 4] },
      { q: '你有多久没真正放松过了？', opts: ['昨天刚放松', '一周内', '一个月内', '想不起来了'], score: [1, 2, 3, 4] },
    ],
    resultMap: [
      [5, '🌿 压力很低：状态在线，继续保持这种松弛感'],
      [10, '😌 压力适中：正常范围，注意定期给自己放个假'],
      [15, '🌋 压力偏高：该给自己减负了，试试运动或深呼吸'],
      [20, '🔥 压力爆表：请立刻休息！散步/听歌/找人聊聊都行'],
    ],
  },
  lc: {
    desc: '你的理财风格是什么？',
    questions: [
      { q: '发工资后你第一件事？', opts: ['存一笔', '还账单', '买喜欢的东西', '没想那么多'], score: [4, 3, 2, 1] },
      { q: '你会记账吗？', opts: ['每笔都记', '记大头', '偶尔记', '从不记'], score: [4, 3, 2, 1] },
      { q: '面对打折促销你？', opts: ['只买需要的', '会冲动买', '囤货', '根本控制不住'], score: [4, 3, 2, 1] },
      { q: '你对投资的态度？', opts: ['稳健为主', '小试牛刀', '高风险高回报', '不敢碰'], score: [4, 3, 2, 1] },
      { q: '你的应急储备金？', opts: ['够 6 个月', '够 3 个月', '够 1 个月', '月光'], score: [4, 3, 2, 1] },
    ],
    resultMap: [
      [5, '💸 快乐月光族：先储蓄后消费，从工资日自动转存开始'],
      [10, '🐷 保守储蓄型：稳健是好事，可以学点低风险理财'],
      [15, '📈 精明理财型：有规划有行动，注意分散风险'],
      [20, '🏦 理财大师：你的财务习惯值得很多人学习！'],
    ],
  },
  sm: {
    desc: '你的睡眠质量如何？',
    questions: [
      { q: '你通常几点入睡？', opts: ['23 点前', '23-24 点', '24-1 点', '1 点后'], score: [4, 3, 2, 1] },
      { q: '入睡需要多久？', opts: ['10 分钟内', '半小时内', '1 小时内', '很久或靠熬夜'], score: [4, 3, 2, 1] },
      { q: '你半夜会醒吗？', opts: ['一觉到天亮', '偶尔醒', '经常醒', '醒好几次'], score: [4, 3, 2, 1] },
      { q: '白天你的精神状态？', opts: ['精力充沛', '偶尔犯困', '午后崩溃', '全天困'], score: [4, 3, 2, 1] },
      { q: '睡前你通常会？', opts: ['看书放松', '玩手机', '想事情', '打游戏到困'], score: [4, 2, 3, 1] },
    ],
    resultMap: [
      [5, '🦉 夜猫子：试着提前半小时放下手机，身体会感谢你'],
      [10, '😴 睡眠一般：睡前 1 小时远离蓝光，会明显改善'],
      [15, '😊 睡眠不错：保持规律作息，你的状态很好'],
      [20, '🌙 睡眠达人：高质量的睡眠是你最大的武器！'],
    ],
  },
  xl: {
    desc: '你的效率风格诊断',
    questions: [
      { q: '你习惯什么时候处理最难的事？', opts: ['早上', '上午', '下午', '晚上'], score: [4, 3, 2, 1] },
      { q: '你一次能专注多久？', opts: ['2 小时+', '1 小时', '30 分钟', '10 分钟就要摸鱼'], score: [4, 3, 2, 1] },
      { q: '你的待办清单？', opts: ['有条有理', '记在脑子里', '随手贴', '存在即合理'], score: [4, 3, 2, 1] },
      { q: '被打断后你？', opts: ['快速回到状态', '要缓一会儿', '很难回去', '干脆换任务'], score: [4, 3, 2, 1] },
      { q: '你工作/学习时会？', opts: ['手机关静音', '偶尔看消息', '消息一来就看', '边看视频边做'], score: [4, 3, 2, 1] },
    ],
    resultMap: [
      [5, '🐢 佛系效率：试试番茄钟，25 分钟专注 + 5 分钟休息'],
      [10, '🙂 正常效率：找到你的黄金时段，把难事放那里做'],
      [15, '🚀 高效型：专注力不错，注意劳逸结合别过载'],
      [20, '⚡ 效率王者：你的时间管理能力是顶级的！'],
    ],
  },
  gt: {
    desc: '你的沟通风格是什么？',
    questions: [
      { q: '意见不合时你？', opts: ['倾听再表达', '直接反驳', '沉默回避', '先顺着再说'], score: [4, 2, 1, 3] },
      { q: '你更擅长？', opts: ['当面聊', '发消息', '写邮件', '都不太擅长'], score: [4, 3, 2, 1] },
      { q: '别人倾诉时你？', opts: ['认真听+共情', '给建议', '说自己的事', '想快点结束'], score: [4, 3, 2, 1] },
      { q: '你会主动沟通吗？', opts: ['经常主动', '看情况', '等别人找我', '能不问就不问'], score: [4, 3, 2, 1] },
      { q: '你的表达方式？', opts: ['清晰有条理', '生动有趣', '比较含蓄', '想到哪说到哪'], score: [4, 3, 2, 1] },
    ],
    resultMap: [
      [5, '🤐 内敛型：你的沉默是金，但偶尔说出来会更轻松'],
      [10, '😊 温和型：沟通舒服，注意在关键时刻大胆表达'],
      [15, '🗣️ 健谈型：表达力强，倾听时再耐心一点就完美'],
      [20, '💬 沟通大师：你是人群中的桥梁，人人都爱和你聊'],
    ],
  },
  zx: {
    desc: '你的执行力有多强？',
    questions: [
      { q: '想到一个点子你会？', opts: ['立刻做', '记下来找时间做', '想想再说', '过几天就忘了'], score: [4, 3, 2, 1] },
      { q: '你定了计划后？', opts: ['坚决执行', '执行大部分', '坚持几天', '计划就是用来放弃的'], score: [4, 3, 2, 1] },
      { q: '遇到困难时你？', opts: ['想办法解决', '换个方法', '先放一放', '直接放弃'], score: [4, 3, 2, 1] },
      { q: '你做事拖延的情况？', opts: ['很少', '偶尔', '经常', '日常'], score: [4, 3, 2, 1] },
      { q: '你上一次坚持 21 天以上的事？', opts: ['很多', '有过几次', '一两次', '从没有'], score: [4, 3, 2, 1] },
    ],
    resultMap: [
      [5, '🐌 慢热型：从最小的行动开始，先做 5 分钟'],
      [10, '🙂 普通型：执行力够用，缺的是关键时刻推自己一把'],
      [15, '🏃 行动型：想到就做，你已经领先很多人了'],
      [20, '🔥 执行王者：说到做到，没有你完不成的事！'],
    ],
  },
  xt: {
    desc: '你的心态健康度检测',
    questions: [
      { q: '搞砸一件事后你？', opts: ['总结经验再出发', '难过一会就好', '自责很久', '觉得自己不行'], score: [4, 3, 2, 1] },
      { q: '面对批评你？', opts: ['对事不对人', '有点在意但能消化', '很受伤', '记很久'], score: [4, 3, 2, 1] },
      { q: '你经常和他人比较吗？', opts: ['很少', '偶尔', '经常', '天天比'], score: [4, 3, 2, 1] },
      { q: '对未来你？', opts: ['充满期待', '比较乐观', '有点焦虑', '很担忧'], score: [4, 3, 2, 1] },
      { q: '你能接纳自己的不完美吗？', opts: ['完全可以', '大部分时候', '勉强', '不能'], score: [4, 3, 2, 1] },
    ],
    resultMap: [
      [5, '🌧️ 心态预警：对自己温柔一点，你已经做得很好了'],
      [10, '🙂 心态普通：多给自己积极暗示，少和别人比'],
      [15, '😊 心态健康：挫折打不倒你，这份韧性很珍贵'],
      [20, '🌟 心态王者：你自带阳光，还能照亮别人！'],
    ],
  },
};

export default function QuizSection() {
  const [tab, setTab] = useState<QTab>('xz');

  return (
    <div className="space-y-5">
      <div className="report-card p-3">
        <SubTabBar tabs={QTABS} active={tab} onChange={(id) => setTab(id as QTab)} />
      </div>

      {(tab === 'xz' || tab === 'sx' || tab === 'xx' || tab === 'tl' || tab === 'jm' || tab === 'xm') && (
        <HoroscopeTab
          emoji={QTABS.find((t) => t.id === tab)?.emoji || '✨'}
          title={QTABS.find((t) => t.id === tab)?.label || ''}
          signPool={SIGN_POOLS[tab]}
        />
      )}
      {tab === 'xg' && <QuizTab emoji="🧬" title="性格测试" desc={QUIZZES.xg.desc} questions={QUIZZES.xg.questions} resultMap={QUIZZES.xg.resultMap} />}
      {tab === 'ty' && <QuizTab emoji="🦥" title="拖延测试" desc={QUIZZES.ty.desc} questions={QUIZZES.ty.questions} resultMap={QUIZZES.ty.resultMap} />}
      {tab === 'yl' && <QuizTab emoji="🌋" title="压力测试" desc={QUIZZES.yl.desc} questions={QUIZZES.yl.questions} resultMap={QUIZZES.yl.resultMap} />}
      {tab === 'lc' && <QuizTab emoji="💰" title="理财测试" desc={QUIZZES.lc.desc} questions={QUIZZES.lc.questions} resultMap={QUIZZES.lc.resultMap} />}
      {tab === 'sm' && <QuizTab emoji="🛏️" title="睡眠测试" desc={QUIZZES.sm.desc} questions={QUIZZES.sm.questions} resultMap={QUIZZES.sm.resultMap} />}
      {tab === 'xl' && <QuizTab emoji="⚡" title="效率测试" desc={QUIZZES.xl.desc} questions={QUIZZES.xl.questions} resultMap={QUIZZES.xl.resultMap} />}
      {tab === 'gt' && <QuizTab emoji="🗣️" title="沟通测试" desc={QUIZZES.gt.desc} questions={QUIZZES.gt.questions} resultMap={QUIZZES.gt.resultMap} />}
      {tab === 'zx' && <QuizTab emoji="🏃" title="执行力测试" desc={QUIZZES.zx.desc} questions={QUIZZES.zx.questions} resultMap={QUIZZES.zx.resultMap} />}
      {tab === 'xt' && <QuizTab emoji="🧘" title="心态测试" desc={QUIZZES.xt.desc} questions={QUIZZES.xt.questions} resultMap={QUIZZES.xt.resultMap} />}
    </div>
  );
}
