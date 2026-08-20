import SubTabBar from '@/components/SubTabBar';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Shuffle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============ 通用内容池组件 ============
function PoolTab({ emoji, title, desc, pool }: { emoji: string; title: string; desc: string; pool: string[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const [idx, setIdx] = useState(hash(`${today}-${title}`) % pool.length);
  const item = pool[idx];

  return (
    <div className="report-card p-8 text-center">
      <div className="text-4xl mb-3">{emoji}</div>
      <div className="section-label mb-1">{title}</div>
      <div className="section-subtitle mb-6">{desc}</div>
      <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto mb-7 min-h-[72px] flex items-center justify-center">
        <div className="text-[14px] text-slate-700 leading-relaxed font-medium">{item}</div>
      </motion.div>
      <div className="flex justify-center gap-3">
        <Button onClick={() => setIdx((i) => (i + 1) % pool.length)} className="bg-[#0033a0] hover:bg-[#002580] rounded-none h-9 px-6">
          <Shuffle className="w-3.5 h-3.5 mr-1.5" /> 换一条
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard?.writeText(item).catch(() => undefined);
            toast.success('已复制');
          }}
          className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-none h-9 px-4"
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" /> 复制
        </Button>
      </div>
      <div className="text-[9px] text-slate-300 mt-5">今日随机 · {today}</div>
    </div>
  );
}

type FTab =
  | 'joke' | 'cold' | 'chengyu' | 'riddle' | 'xiehou' | 'tongue' | 'brain' | 'poem'
  | 'duji' | 'rainbow' | 'love' | 'motto' | 'inspire' | 'fish' | 'social' | 'sakana';

const FTABS: { id: FTab; label: string; emoji: string }[] = [
  { id: 'sakana', label: '桌宠Sakana', emoji: '🐟' },
  { id: 'joke', label: '每日笑话', emoji: '😂' },
  { id: 'cold', label: '冷笑话', emoji: '🧊' },
  { id: 'chengyu', label: '成语', emoji: '📖' },
  { id: 'riddle', label: '谜语', emoji: '❓' },
  { id: 'xiehou', label: '歇后语', emoji: '🎭' },
  { id: 'tongue', label: '绕口令', emoji: '👅' },
  { id: 'brain', label: '脑筋急转弯', emoji: '🧠' },
  { id: 'poem', label: '古诗词', emoji: '🏮' },
  { id: 'duji', label: '毒鸡汤', emoji: '☠️' },
  { id: 'rainbow', label: '彩虹屁', emoji: '🌈' },
  { id: 'love', label: '情话', emoji: '💘' },
  { id: 'motto', label: '人生格言', emoji: '🌅' },
  { id: 'inspire', label: '励志语录', emoji: '⚡' },
  { id: 'fish', label: '摸鱼语录', emoji: '🐟' },
  { id: 'social', label: '社交语录', emoji: '🤝' },
];

const POOLS: Record<FTab, string[]> = {
  sakana: [],
  joke: [
    '程序员最讨厌的两件事：写注释，别人不写注释。',
    '我从来不吸烟，但我经常吸……猫，因为它太可爱了。',
    '今天去理发店，理发师问我想要什么发型，我说：随便，结果他真给我剪了个"随便"。',
    '减肥最有效的方法：把体重秤的电池抠了。',
    '小时候以为长大了一切都会好，长大后发现……小时候以为对了。',
    '我的钱包就像洋葱，每次打开都让人流泪。',
    '老板问：你上班为什么迟到？我：因为梦到自己在加班，想多睡会儿体验一下。',
    '数学老师：这道题谁来？全班安静。老师：好，就你（指空气），来。',
    '我这个人没什么缺点，就是缺点钱。',
    '昨天去超市，收银员问我：要袋子吗？我说：要！她问：大的还是小的？我：能装下我的自尊心的。',
    '女朋友问我：你觉得我胖吗？我说：不胖，就是占地方。',
    '医生：你平时运动吗？我：运动的，天天甩锅。',
  ],
  cold: [
    '为什么北极熊不吃企鹅？因为企鹅住在南极。',
    '有一只北极熊，它很无聊，就拔自己的毛玩，拔着拔着……它冷死了。',
    '有一天，0 和 8 在街上遇到。0 说：你系腰带啦？',
    '为什么汉堡包总觉得自己很热？因为它有 beef（牛肉）——很热。',
    '有一只羊，它走啊走，突然撞到墙上，死了。它叫"杨过"（羊过墙）。',
    '小明考试得了 0 分，他妈妈说：你怎么回事？小明：老师说我把卷子上的名字写错了，扣光了分。',
    '为什么鱼会上岸？因为想看看"陆地"长什么样——结果被红烧了。',
    '一只蜗牛爬树，爬了三天三夜，终于爬到了树顶，然后……它发现树是倒的。',
    '世界上最遥远的距离，不是生与死，而是我站在你面前，你却不知道——我带了零食。',
    '为什么数学书很忧伤？因为它有太多"问题"。',
    '有个字，人人都会念错，是什么字？答案是"错"字。',
    '有一天，牛奶和面包吵架了，牛奶说：你算什么东西？面包说：我比你"面"（绵）软！',
  ],
  chengyu: [
    '画蛇添足：做事多此一举，反而不恰当。',
    '守株待兔：不努力而存侥幸心理，妄想不劳而获。',
    '亡羊补牢：出了问题及时补救，还不算晚。',
    '对牛弹琴：对不懂道理的人讲道理。',
    '井底之蛙：比喻见识短浅的人。',
    '掩耳盗铃：自己欺骗自己。',
    '刻舟求剑：拘泥成例，不知变通。',
    '自相矛盾：说话办事前后抵触。',
    '狐假虎威：倚仗别人的势力欺压人。',
    '塞翁失马：坏事在一定条件下可以变成好事。',
    '一鸣惊人：平时没有特殊表现，一干就有惊人的成绩。',
    '水滴石穿：只要有恒心，不断努力，事情一定能成功。',
  ],
  riddle: [
    '什么东西越洗越脏？——水。',
    '什么门永远关不上？——球门。',
    '什么东西有头无脚？——枕头。',
    '什么东西越用越新？——脑筋。',
    '什么书买不到？——遗书。',
    '什么路最窄？——冤家路窄。',
    '什么蛋不能吃？——脸蛋。',
    '什么马不吃草？——木马。',
    '什么布剪不断？——瀑布。',
    '什么车坐不了人？——风车。',
    '什么雨不能淋？——流星雨。',
    '什么花没有枝？——浪花。',
  ],
  xiehou: [
    '哑巴吃黄连——有苦说不出。',
    '十五个吊桶打水——七上八下。',
    '竹篮打水——一场空。',
    '泥菩萨过河——自身难保。',
    '八仙过海——各显神通。',
    '芝麻开花——节节高。',
    '兔子尾巴——长不了。',
    '黄鼠狼给鸡拜年——没安好心。',
    '擀面杖吹火——一窍不通。',
    '水中捞月——一场空。',
    '姜太公钓鱼——愿者上钩。',
    '司马昭之心——路人皆知。',
  ],
  tongue: [
    '四是四，十是十，十四是十四，四十是四十，别把十四说四十。',
    '吃葡萄不吐葡萄皮，不吃葡萄倒吐葡萄皮。',
    '红鲤鱼与绿鲤鱼与驴。',
    '黑化肥发灰会挥发，灰化肥挥发会发黑。',
    '粉红墙上画凤凰，凤凰画在粉红墙。',
    '八百标兵奔北坡，炮兵并排北边跑。',
    '老龙恼怒闹老农，老农恼怒闹老龙。',
    '山前有四十四棵死涩柿子树，山后有四十四只石狮子。',
    '打南边来了个喇嘛，手里提着五斤鳎目；打北边来个哑巴，腰里别着个喇叭。',
    '树上卧只猴，树下蹲条狗，猴跳下来碰了狗，狗咬猴，猴咬狗。',
    '牛郎恋刘娘，刘娘念牛郎，牛郎年年念刘娘，刘娘年年恋牛郎。',
    '化肥会挥发，黑化肥发灰，灰化肥发黑，黑化肥发灰会挥发。',
  ],
  brain: [
    '什么东西早上四条腿，中午两条腿，晚上三条腿？——人（婴儿爬、成人走、老人拄拐）。',
    '什么车没有轮子？——象棋里的车。',
    '什么东西越拿越多？——知识。',
    '什么人永远长不大？——照片里的人。',
    '什么门永远关不上？——球门。',
    '什么东西你问它，它永远不回答？——手机（静音时）。',
    '什么杯子不能装水？——奖杯。',
    '什么东西有五个手指但不是手？——手套。',
    '什么鬼最受欢迎？——捣蛋鬼。',
    '什么动物没有方向感？——麋鹿（迷路）。',
    '什么东西爬得最慢但最准时？——蜗牛（和闹钟）。',
    '什么书最畅销？——毕业证书。',
  ],
  poem: [
    '海内存知己，天涯若比邻。——王勃',
    '会当凌绝顶，一览众山小。——杜甫',
    '长风破浪会有时，直挂云帆济沧海。——李白',
    '莫愁前路无知己，天下谁人不识君。——高适',
    '问渠那得清如许？为有源头活水来。——朱熹',
    '山重水复疑无路，柳暗花明又一村。——陆游',
    '沉舟侧畔千帆过，病树前头万木春。——刘禹锡',
    '天生我材必有用，千金散尽还复来。——李白',
    '不畏浮云遮望眼，自缘身在最高层。——王安石',
    '落红不是无情物，化作春泥更护花。——龚自珍',
    '纸上得来终觉浅，绝知此事要躬行。——陆游',
    '路漫漫其修远兮，吾将上下而求索。——屈原',
  ],
  duji: [
    '你不努力一下，都不知道什么叫绝望。',
    '生活不止眼前的苟且，还有读不懂的诗和到不了的远方。',
    '只要肯努力，没什么事是你搞不砸的。',
    '当你觉得自己又丑又穷的时候，不要悲伤，至少你的判断是对的。',
    '现在的人天天喊着减肥，却连美食的诱惑都抵抗不了，还是先抵抗一下闹钟吧。',
    '失败是成功之母，那你都失败多少次了，妈呢？',
    '人生就像打电话，不是你先挂，就是我先挂。',
    '别灰心，人生就是这样起起落落落落落落落的。',
    '努力不一定成功，但不努力一定很轻松。',
    '你以为自己很穷，其实你不止穷，还懒。',
    '岁月是把杀猪刀，而你是那猪。',
    '今天解决不了的事情，不要着急，因为明天也解决不了。',
  ],
  rainbow: [
    '你一定是喝露水长大的，不然怎么这么甜。',
    '你的眼睛里有星星，我都快看醉了。',
    '你是我见过最优秀的人，没有之一。',
    '你的存在，让这个世界好看了 0.01%。',
    '你笑一下，我手机都忘记怎么玩了。',
    '像你这样好看的人，老天爷追着喂饭吃吧？',
    '你的脑子一定很聪明，不然怎么配得上这张脸。',
    '你说话的时候，空气都是甜的。',
    '如果美貌是罪，你已经无期徒刑了。',
    '你一定是上帝最得意的作品，不然怎么这么完美。',
    '和你聊天，我的嘴角就没下来过。',
    '你的出现，拯救了我今天的所有不开心。',
  ],
  love: [
    '我想把世界上最好的都给你，却发现世界上最好的就是你。',
    '你来得晚一点没关系，反正我等你。',
    '我这一生都是坚定的唯物主义者，唯有你，我希望有来生。',
    '遇见你之后，我的世界里再也没有别人。',
    '你是我的唯一，我是你的例外。',
    '你是我疲惫生活里的英雄梦想。',
    '不管世界怎么变，我对你的心不变。',
    '和你在一起，连空气都是甜的。',
    '我想要的未来，就是有你的未来。',
    '你一笑，我的心就化了。',
    '喜欢你是很久以前的事，爱你是一辈子的事。',
    '这世界车水马龙，而我眼里只有你。',
  ],
  motto: [
    '人生没有白走的路，每一步都算数。',
    '种一棵树最好的时间是十年前，其次是现在。',
    '知人者智，自知者明。',
    '君子和而不同，小人同而不和。',
    '不积跬步，无以至千里。',
    '知之者不如好之者，好之者不如乐之者。',
    '己所不欲，勿施于人。',
    '工欲善其事，必先利其器。',
    '博观而约取，厚积而薄发。',
    '静以修身，俭以养德。',
    '宝剑锋从磨砺出，梅花香自苦寒来。',
    '天行健，君子以自强不息。',
  ],
  inspire: [
    '你的日积月累，终会成为别人的望尘莫及。',
    '别害怕走得慢，只要一直在走。',
    '你现在偷的懒，都会变成以后打脸的巴掌。',
    '每天进步一点点，坚持带来大改变。',
    '既然选择了远方，便只顾风雨兼程。',
    '努力的意义：以后的日子里，放眼望去全是自己喜欢的人和事。',
    '你只管努力，剩下的交给时间。',
    '真正的强者，不是没有眼泪的人，而是含着眼泪奔跑的人。',
    '没有一颗心会因为追求梦想而受伤。',
    '与其临渊羡鱼，不如退而结网。',
    '星光不问赶路人，时光不负有心人。',
    '再小的努力，乘以 365 都很明显。',
  ],
  fish: [
    '摸鱼一时爽，一直摸鱼一直爽。',
    '今天的工作已经完成了百分之……零。',
    '我不是在摸鱼，我是在给鱼喂食。',
    '工作可以慢慢做，但鱼不能少摸。',
    '我的梦想是躺着赚钱，目前实现了一半——躺着。',
    '老板问进度，我说在推进，其实在推塔。',
    '上班的意义在于：有地方吹空调，还有工资拿。',
    '我不是懒，我只是在储蓄精力。',
    '水至清则无鱼，人至闲则摸鱼。',
    '摸鱼不可耻，可耻的是摸不到鱼。',
    '今日份摸鱼指标已完成，超额完成 300%。',
    '上班就像钓鱼，耐心最重要。',
  ],
  social: [
    '真正的朋友，是那个知道你所有糗事还愿意理你的人。',
    '圈子不同，不必强融。',
    '好听的话别当真，难听的话别走心。',
    '三观不同，不必争辩；层次不同，不必强融。',
    '帮人是情分，不帮是本分。',
    '成年人最大的自律：克制纠正别人的欲望。',
    '真诚是最高级的情商。',
    '少说多做，是社交的最高段位。',
    '别人尊重你，不是因为你优秀，而是别人优秀。',
    '高质量的独处，胜过无意义的合群。',
    '朋友之间最舒服的状态：各自忙碌，互相牵挂。',
    '说话留三分，做事留一线，日后好相见。',
  ],
};

export default function FunSection() {
  const [tab, setTab] = useState<FTab>('joke');

  if (tab === 'sakana') {
    return (
      <div className="space-y-5">
        <div className="report-card p-3">
          <SubTabBar tabs={FTABS} active={tab} onChange={(id) => setTab(id as FTab)} />
        </div>
        <div className="report-card p-6">
          <div className="section-label mb-1">🐟 Sakana 桌宠模拟器</div>
          <div className="section-subtitle mb-4">开源项目 itorr/sakana（★4k+）· 点击/拖动小鱼互动，可固定到页面角落</div>
          <iframe
            src="/tools/sakana/index.html"
            title="Sakana 桌宠"
            className="w-full border thin-border bg-white"
            style={{ height: 560 }}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => window.open('/tools/sakana/index.html', '_blank')}
              className="px-3 py-1.5 bg-[#0033a0] hover:bg-[#002580] text-white text-[10px] font-black uppercase tracking-wider bp-no-elevate"
            >
              全屏打开 ↗
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="report-card p-3">
        <SubTabBar tabs={FTABS} active={tab} onChange={(id) => setTab(id as FTab)} />
      </div>

      <PoolTab
        emoji={FTABS.find((t) => t.id === tab)?.emoji || '✨'}
        title={FTABS.find((t) => t.id === tab)?.label || ''}
        desc="每日一条 · 随机换新 · 仅供娱乐"
        pool={POOLS[tab]}
      />
    </div>
  );
}
