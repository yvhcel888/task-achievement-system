# 任务成就激励系统 - 需求拆解文档

## 产品概述

- **产品类型**: 游戏化任务激励工具
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 希望通过游戏化方式提升任务完成动力的个人用户
- **核心价值**: 将日常任务完成转化为"打怪升级"体验，通过成就徽章、积分奖励和动画反馈提供正向激励
- **界面语言**: 中文
- **主题偏好**: 浅色（活泼明亮配色）
- **导航模式**: 无导航（单页应用）
- **参照类型**: 类游戏（小游戏子场景的成就/积分/反馈机制）+ 类工具（表单输入+数据展示）

---

## 需求澄清

- **用户原话核心**: 输入完成的任务 → 自动匹配成就奖励 → 动画反馈 → 数据统计展示，实现"打怪升级"式成就感
- **使用场景**: 个人日常任务管理、习惯养成、自我激励
- **交付物形态**: 交互式单页应用
- **推测依据**: 需求兼具工具输入属性和游戏化反馈机制，核心是任务→奖励→升级的闭环体验，按 prototype-app 单页方案规划

---

## 页面结构总览

**页面文件**: `AchievementTaskPage.tsx`

| 区域 | 说明 |
|-----|------|
| 顶部玩家信息栏 | 展示当前等级、总积分、经验条（升级进度）、玩家称号 |
| 左侧任务输入与历史区 | 任务输入表单 + 任务历史记录列表 |
| 右侧成就展示区 | 已获得徽章陈列 + 阶段性成就进度 + 数据统计面板 |
| 成就解锁弹窗层 | 新成就解锁时的全屏/居中弹窗（带粒子特效） |

---

## 页面布局建议

- **布局模式**: 左右分栏（桌面端），移动端上下堆叠 —— 用户需要同时看到输入操作和成就反馈，左右分栏能让任务提交后右侧成就区即时响应
- **视觉重心**: 成就展示区（右侧）—— 游戏化体验的核心是"获得奖励的爽感"，徽章和等级展示应占据视觉主导
- **结果承载区**: 成就展示区（徽章网格 + 数据统计卡 + 升级进度条）；初始态为示例占位（预设 2-3 个已解锁徽章 + 初始等级 1），任务提交后即时更新
- **源材料承载区**: 左侧任务历史列表，按时间倒序展示用户已完成的任务，支持查看类型和难度标签

---

## 数据来源声明

| 数据/操作 | 来源类型 | 实现要求 | mock 兜底 |
|---|---|---|---|
| 任务完成记录 | local-persist | localStorage key=`__app_task_achievement_tasks`，存储任务名称、类型、难度、完成时间、获得积分 | 初始 3 条 source='mock' 示例任务 |
| 成就徽章数据 | demo-mock | src/data/achievements.ts const 定义所有徽章配置（名称、图标、解锁条件、稀有度） | ✅ 本身就是 mock 配置表 |
| 用户进度数据 | local-persist | localStorage key=`__app_task_achievement_progress`，存储等级、总积分、已解锁徽章ID列表、连续天数、各类型任务计数 | 初始 mock 值：等级1、积分0、连续0天 |
| 成就解锁判定 | demo-mock | 前端规则引擎，提交任务后按徽章条件逐项检查匹配 | 规则在 achievements.ts 中配置 |

> 类型选择说明：核心数据（任务记录、用户进度）需要持久化保存，使用 localStorage；成就徽章配置表为静态规则，属 demo-mock；成就匹配为前端规则判断，不涉及 AI 语义判定。

---

## 功能列表

- **页面/区块**: 顶部玩家信息栏
  - **页面目标**: 展示玩家当前游戏化状态，提供升级成就感
  - **功能点**:
    - **等级展示**: 显示当前等级数字 + 称号（如"新手冒险者""任务达人"），升级时有数字跳动动画
    - **经验进度条**: 展示当前等级到下一级的经验进度百分比，获得积分时进度条平滑增长动画
    - **总积分展示**: 显示累计获得的积分总量，带千分位格式化
    - **连续天数展示**: 显示连续完成任务的天数，带火焰图标增强视觉

- **页面/区块**: 任务输入区
  - **页面目标**: 让用户快速录入完成的任务
  - **功能点**:
    - **任务表单提交**: 任务名称输入框 + 任务类型下拉（学习/工作/运动/生活/其他）+ 难度选择器（简单/中等/困难，用星级或色块区分）+ 提交按钮
    - **积分预览**: 选择难度后实时显示本次可获得的积分值（简单=10分 / 中等=25分 / 困难=50分）
    - **提交反馈**: 点击提交后按钮 loading 态 → 成功后表单清空 + 积分飘字动效 + toast 提示 "任务完成！+XX 积分"

- **页面/区块**: 任务历史记录
  - **页面目标**: 回顾已完成任务，形成积累感
  - **功能点**:
    - **任务列表展示**: 按时间倒序排列，每条显示任务名称、类型标签（彩色）、难度标签、获得积分数、完成时间
    - **空状态处理**: 无任务时显示引导插画和提示文案
    - **分类统计汇总**: 顶部显示各类型任务数量小标签（学习: 5 / 工作: 3 等）

- **页面/区块**: 成就展示区
  - **页面目标**: 核心激励区，展示已获得的徽章和成就进度
  - **功能点**:
    - **徽章网格陈列**: 已获得徽章彩色显示 + 未获得徽章灰度显示 + hover 时显示解锁条件tooltip
    - **徽章分类**: 按类型分组（基础成就 / 难度成就 / 连续成就 / 数量成就），可切换查看
    - **阶段性成就进度卡**: 展示"累计完成10个任务""连续完成7天""完成5个困难任务"等进度条，明确告知用户还差多少
    - **数据统计面板**: 总任务数、各类型占比、平均每日完成数、最长连续天数等数据卡片

- **页面/区块**: 成就解锁弹窗（反馈层）
  - **页面目标**: 强化"获得奖励"的爽感
  - **功能点**:
    - **徽章弹出动画**: 新成就解锁时居中弹出，徽章从缩放 0 → 1.2 → 1 弹性动画 + 光晕旋转效果
    - **粒子特效**: 弹窗周围发射彩色粒子/彩带，持续 2-3 秒
    - **成就信息展示**: 徽章名称 + 稀有度标签（普通/稀有/史诗/传说）+ 解锁条件 + 奖励积分
    - **多成就连弹**: 一次任务提交解锁多个成就时，逐个依次弹出（间隔 800ms），形成连续惊喜感
    - **关闭交互**: 点击"收下"按钮或遮罩关闭，带淡出动画

---

## 数据共享配置

| 存储键名 | 数据说明 | 使用区块 |
|---------|---------|---------|
| `__app_task_achievement_tasks` | 任务完成记录列表，类型 `ITask[]` | 任务输入区、任务历史记录、成就展示区 |
| `__app_task_achievement_progress` | 用户进度数据，类型 `IUserProgress` | 顶部信息栏、成就展示区、成就弹窗 |
| `__app_task_achievement_achievements` | 成就徽章配置表，类型 `IAchievement[]` | 成就展示区、成就匹配引擎 |

```ts
interface ITask {
  id: string;
  name: string;
  type: 'study' | 'work' | 'sport' | 'life' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  completedAt: number; // timestamp
  source?: 'mock' | 'user';
}

interface IUserProgress {
  level: number;
  totalPoints: number;
  currentExp: number;
  expToNextLevel: number;
  unlockedAchievementIds: string[];
  streakDays: number;
  lastCompletedDate: string; // YYYY-MM-DD
  taskCountsByType: Record<string, number>;
  taskCountsByDifficulty: Record<string, number>;
  totalTasks: number;
  longestStreak: number;
}

interface IAchievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji 或 icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'basic' | 'difficulty' | 'streak' | 'quantity' | 'type';
  condition: {
    type: 'totalTasks' | 'streakDays' | 'difficultyCount' | 'typeCount' | 'totalPoints';
    target: number;
    difficulty?: string;
    taskType?: string;
  };
  rewardPoints: number;
}
```

---

## 成就系统规则设计（供实现参考）

### 积分规则
| 难度 | 积分 |
|-----|------|
| 简单 | 10 分 |
| 中等 | 25 分 |
| 困难 | 50 分 |

### 等级经验公式
- 升级所需经验 = `level * 100`（1级升2级需100经验，2级升3级需200经验，以此类推）
- 每获得 1 积分 = 1 经验值

### 徽章示例配置（至少 12 个，覆盖各维度）
| 徽章名称 | 稀有度 | 解锁条件 |
|---------|-------|---------|
| 初次启程 | 普通 | 完成第 1 个任务 |
| 十全十美 | 稀有 | 累计完成 10 个任务 |
| 百任务达人 | 史诗 | 累计完成 100 个任务 |
| 三日连更 | 普通 | 连续完成 3 天 |
| 七日坚持 | 稀有 | 连续完成 7 天 |
| 月度勇士 | 史诗 | 连续完成 30 天 |
| 小试牛刀 | 普通 | 完成 1 个困难任务 |
| 迎难而上 | 稀有 | 完成 10 个困难任务 |
| 困难征服者 | 传说 | 完成 50 个困难任务 |
| 学霸驾到 | 稀有 | 完成 20 个学习类任务 |
| 工作狂人 | 稀有 | 完成 20 个工作类任务 |
| 运动健将 | 稀有 | 完成 20 个运动类任务 |
| 生活达人 | 稀有 | 完成 20 个生活类任务 |
| 积分破千 | 史诗 | 累计积分达到 1000 |
| 全能选手 | 传说 | 四种类型任务各完成至少 10 个 |

---

## 质量基线确认

- [x] 核心功能完整可用（任务输入→积分计算→成就匹配→展示更新 闭环完整）
- [x] 有基本的视觉层次（游戏化风格、分区明确、徽章视觉突出）
- [x] 交互有反馈（提交动画、积分飘字、成就弹窗、粒子特效）
- [x] 边界状态有处理（空任务列表、无成就解锁、升级临界点计算）
- [x] 数据持久化（任务记录和用户进度存 localStorage）

-------

<scene_type>prototype-app</scene_type>

# UI 设计指南

## 1. 设计推导依据

- **参考意图**: Free Direction —— 无参考材料，从"打怪升级"游戏化任务激励语义出发自主设计
- **核心情绪 / 应用类型**: 游戏化成长工具，核心情绪是"即时正反馈 + 打怪升级式成就感"
- **独特记忆点**: 每完成一个任务触发"徽章弹出 + 经验条跳动 + 粒子爆散"的三段式庆祝，进度感来自可视的等级经验槽而非冰冷数字

## 2. Art Direction

- **方向名**: 活力徽章游戏风
- **Design Style**: Rounded 圆润几何 + Soft Pop 轻量流行 —— 圆润几何降低使用门槛，Soft Pop 用高饱和点缀制造奖励高光，匹配"打怪升级"的多巴胺反馈
- **DNA 参数**: 圆角 soft（rounded-xl / rounded-2xl）/ 阴影 layered（shadow-md + glow 效果用于徽章弹出）/ 间距 standard（gap-4 / p-6）/ 字体方向 display 活泼圆润，body 清晰无衬线 / 装饰手法 渐变徽章、发光描边、粒子光点、经验条填充动效
- **应用类型**: Tool —— 左输入区 + 右数据面板的双栏工作台布局

## 3. Color System

**色彩关系**: 活力橙主色 + 同色暖粉反馈底 + 极浅米白工作背景 + 紫蓝渐变用于高级徽章高光
**配色设计理由**: 橙色是"成就 + 能量 + 多巴胺"的经典色，承担主按钮与等级标识；暖粉浅底承接 hover 与选中态，保持活泼但不刺眼；米白背景降低长时间使用疲劳；紫蓝渐变保留给稀有徽章与升级时刻，制造"稀有奖励"的视觉权重差
**主色推导**: 从"游戏化激励 / 打怪升级 / 成就感"语义出发，选高饱和暖橙作为 primary，象征能量与奖励；accent 用同色系浅粉降饱和，保持画面统一；稀有奖励色用冷调紫蓝形成暖色中的冷锚点，强化珍贵感
**使用比例**: 60% 中性（bg + card + border）/ 30% 辅助（accent + 类型色 + 语义色）/ 10% primary；primary 只用于主 CTA、等级数字、经验条填充；tab 激活、icon、边框、链接用 accent 或中性色

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|---|---|---|---|---|
| bg | `--background` | `bg-background` | hsl(30 30% 98%) | 暖米白页面背景，低对比不疲劳 |
| card | `--card` | `bg-card` | hsl(0 0% 100%) | 纯白卡片承载任务表单与数据面板 |
| text | `--foreground` | `text-foreground` | hsl(24 20% 18%) | 深棕黑正文，暖色底上对比度舒适 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(24 10% 48%) | 辅助说明与元信息，低饱和度 |
| primary | `--primary` | `bg-primary` / `text-primary` | hsl(28 95% 55%) | 活力橙，主交互与等级标识 |
| primaryForeground | `--primary-foreground` | `text-primary-foreground` | hsl(0 0% 100%) | 主色上的纯白文字 |
| accent | `--accent` | `bg-accent` | hsl(32 90% 92%) | 暖粉浅底，hover / 选中 / Skeleton |
| accentForeground | `--accent-foreground` | `text-accent-foreground` | hsl(24 70% 35%) | accent 上的深橙棕文字 |
| border | `--border` | `border-border` | hsl(30 20% 88%) | 暖灰边界，比 bg 深一度，柔和不突兀 |

**语义色提示**: 
- 成功（任务完成 / 经验增加）：hsl(142 65% 45%)，bg hsl(142 70% 94%) / border hsl(142 55% 78%) / text hsl(142 70% 28%)；饱和度与 primary 对齐（±5%），用于成就解锁横幅与 +EXP 数字
- 警告（任务难度高 / 连续打卡提醒）：hsl(42 90% 55%)，bg hsl(42 90% 92%) / border hsl(42 80% 75%) / text hsl(42 80% 25%)；同暖色系，与 primary 色温一致
- 稀有徽章渐变：hsl(262 85% 62%) → hsl(200 90% 60%)，仅用于高级成就徽章描边与升级闪光，冷色跳脱但低权重

## 4. 字体与节奏

- **font-display**: ZCOOL QingKe HuangYou + Noto Sans SC —— 圆润活泼的中文显示字体用于等级数字、徽章称号和大标题，匹配游戏化气质
- **font-body**: Noto Sans SC —— 清晰现代无衬线，任务描述、表单标签与历史记录长时间阅读不疲劳
- **字号**: H1（等级/大数字）text-5xl ~ text-6xl；H2（面板标题）text-2xl ~ text-3xl；body text-base；muted text-sm
- **圆角**: 大 —— 卡片 rounded-2xl，按钮 rounded-xl，徽章圆形 rounded-full，整体圆润亲和无锐角

## 5. 全局布局契约

- **Reference Layout Use**: 按需求结构推导
- **Page / Section Order**: 顶部状态栏（等级 + 经验条 + 总积分）→ 主双栏（左：任务输入区；右：成就徽章墙）→ 底部任务历史记录列表
- **Standard Content Zone**: max-w-6xl + `mx-auto`，桌面端双栏布局信息密度适中
- **Shell / Frame Alignment**: 同宽 —— 内容容器与页面框架共享 max-w-6xl，顶部状态栏横跨全宽但内容受 6xl 约束
- **Padding & Rhythm**: `px-4 md:px-6 lg:px-8 py-8 md:py-10`，区块间 gap-6，卡片内 p-6
- **Full-bleed Zones**: 升级庆祝遮罩、徽章解锁弹层全屏覆盖，不受内容区约束
- **Local Narrowing**: 任务输入表单在左栏内天然收窄，无需额外 max-w
- **Overflow Strategy**: 任务历史记录表格、徽章墙网格超出时垂直滚动；移动端单栏布局自然堆叠
- **Flexibility Boundary**: 允许移动端降为单栏、调整卡片内边距和徽章网格列数；不允许变更主色、圆角系统、经验条样式和庆祝动效逻辑

## 6. 视觉与动效

- **装饰**: 渐变描边徽章、粒子光点、经验条发光、稀有徽章微光浮动
- **阴影/边界**: 中 —— 卡片 shadow-md 柔和投影；徽章弹出时叠加 `shadow-xl + glow` 橙色光晕
- **动效**: 丰富 —— 任务提交后按钮反馈（缩放 + 对勾）→ 经验条平滑填充 + 数字跳动 → 徽章从底部弹出（弹性缩放 + 旋转 10°）→ 粒子从中心爆散（20-30 个光点向外扩散淡出）→ 稀有成就追加全屏闪光与震动；所有过渡 300-600ms，弹性曲线 ease-out

## 7. 组件原则

- 按钮、输入框、难度选择器、类型标签必须有 Default / Hover / Active / Focus / Disabled 状态
- Primary 承担"提交任务"唯一主行动；难度选择用 segmented control，选中态用 accent 底 + primary 文字
- 徽章组件三态：未解锁（灰度 + 低透明度 + 锁图标）/ 已解锁（彩色 + 微光）/ 新解锁（高亮描边 + 呼吸动画 + "NEW" 角标）
- 经验条组件：渐变填充 + 末端发光点 + 等级数字左侧展示，升级时触发闪光脉冲
- 空状态、加载态延续徽章与粒子视觉语言，不用通用占位图

## 8. Image Direction

- **Image Role**: 成就徽章图标 + 背景氛围装饰
- **Image Art Direction**: 徽章采用圆润扁平 + 微渐变插画风格，每个类型（学习/工作/运动/生活/稀有）有独立母题（书本、公文包、哑铃、咖啡杯、皇冠），统一圆形底 + 2px 渐变描边 + 内部高光点；背景装饰用极淡的暖橙粉径向渐变斑点，低透明度（10-15%）散落在页面四角，营造轻松游戏氛围但不抢内容
- **Image Prompt Keywords**: flat illustration badge, circular shape, soft gradient, 2px gradient outline, small highlight dot, warm orange and pink palette, book icon / briefcase icon / dumbbell icon / coffee cup icon / crown icon, cute and energetic, white background, clean vector style
- **Image Avoidance**: 避免 3D 厚重拟物徽章、金属质感、复杂背景、商务人物素材、无意义炫光、与主题无关的科技感元素

## 9. Anti-patterns

- **Default SaaS drift**: 退回默认蓝紫渐变 + 灰白卡片；必须用暖橙 + 圆润徽章 + 粒子反馈建立游戏化识别
- **Mono-hue tyranny**: 主按钮、tab、icon、边框、经验条全用橙色；primary 只给 CTA 和等级核心数字，其余交 accent / 类型色 / 中性色
- **Reward fatigue**: 每个任务都放全屏烟花 + 震动；区分普通任务（经验条动效）、普通徽章（弹出 + 微光）、稀有/阶段成就（全屏庆祝 + 粒子爆散），形成奖励梯度
- **Invisible interaction**: 只做 hover 动画忽略 focus-visible；所有输入框、按钮、徽章都要有清晰键盘焦点环
- **Status color drift**: 成功绿和警告黄饱和度远高于主色，画面刺眼；语义色饱和度与 primary 对齐 ±15%，保持暖色调统一
- **Empty state void**: 无任务时只显示"暂无数据"文字；空状态用灰度徽章 + 引导文案 + 首次任务额外奖励提示，延续游戏化叙事