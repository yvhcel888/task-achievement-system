import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Target, TrendingUp, Calendar, CheckCircle2, LogOut, User, Home, Music, Bot, MessageCircle, Gamepad2, Gift, BarChart3, Settings, Sun, Wrench, Sparkles, FlaskConical, PenTool, Globe, Tv, Box, Fish } from 'lucide-react';
import SubTabBar from '@/components/SubTabBar';

import { GameProvider, useGame } from '@/contexts/GameContext';
import { MusicPlayerProvider } from '@/contexts/MusicContext';
import { useAuth } from '@/contexts/AuthContext';
import PlayerStatsBar from './sections/PlayerStatsBar';
import TaskInputSection from './sections/TaskInputSection';
import TaskHistorySection from './sections/TaskHistorySection';
import AchievementSection from './sections/AchievementSection';
import AchievementCelebration from './sections/AchievementCelebration';
import FunnyHallSection from './sections/FunnyHallSection';
import FunnyCelebration from './sections/FunnyCelebration';
import PetFortuneBar from './sections/PetFortuneBar';
import TitleEquipPanel from './sections/TitleEquipPanel';
import WeeklyReportCard from './sections/WeeklyReportCard';
import MusicSection from './sections/MusicSection';
import MusicPlayerBar from './sections/MusicPlayerBar';
import AIChatSection from './sections/AIChatSection';
import BiliSection from './sections/BiliSection';
import MusicSearchSection from './sections/MusicSearchSection';
import ModelSection from './sections/ModelSection';
import PetSection from './sections/PetSection';
import CommunitySection from './sections/CommunitySection';
import GamesSection from './sections/GamesSection';
import GoalsSection from './sections/GoalsSection';
import LifestyleSection from './sections/LifestyleSection';
import ToolsSection from './sections/ToolsSection';
import FunSection from './sections/FunSection';
import QuizSection from './sections/QuizSection';
import CreativeSection from './sections/CreativeSection';
import ResetReviewPanel from './sections/ResetReviewPanel';
import DataManageSection from './sections/DataManageSection';

// echarts 体积较大，独立分包按需加载
const StatsChartsSection = lazy(() => import('./sections/StatsChartsSection'));

// ============ 页面分块导航配置 ============
type PageId = 'home' | 'achievements' | 'music' | 'search' | 'bili' | 'models' | 'pet' | 'ai' | 'community' | 'games' | 'goals' | 'life' | 'tools' | 'fun' | 'quiz' | 'creative' | 'analytics' | 'manage';

const PAGES: { id: PageId; label: string; emoji: string; icon: React.ReactNode }[] = [
  { id: 'home', label: '首页', emoji: '🏠', icon: <Home className="w-3.5 h-3.5" /> },
  { id: 'achievements', label: '成就', emoji: '🏆', icon: <Award className="w-3.5 h-3.5" /> },
  { id: 'music', label: '音乐', emoji: '🎵', icon: <Music className="w-3.5 h-3.5" /> },
  { id: 'search', label: '搜歌', emoji: '🔍', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'bili', label: 'B站', emoji: '📺', icon: <Tv className="w-3.5 h-3.5" /> },
  { id: 'models', label: '模型', emoji: '🧊', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'pet', label: '桌宠', emoji: '🐟', icon: <Fish className="w-3.5 h-3.5" /> },
  { id: 'ai', label: 'AI', emoji: '🤖', icon: <Bot className="w-3.5 h-3.5" /> },
  { id: 'community', label: '社区', emoji: '💬', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { id: 'games', label: '游戏', emoji: '🎮', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { id: 'goals', label: '目标', emoji: '🎯', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'life', label: '生活', emoji: '🌿', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'tools', label: '工具', emoji: '🛠️', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'fun', label: '趣味', emoji: '🎈', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'quiz', label: '测试', emoji: '🧪', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: 'creative', label: '创作', emoji: '🎨', icon: <PenTool className="w-3.5 h-3.5" /> },
  { id: 'analytics', label: '数据', emoji: '📊', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'manage', label: '管理', emoji: '⚙️', icon: <Settings className="w-3.5 h-3.5" /> },
];

export default function HomePage() {
  return (
    <GameProvider>
      <MusicPlayerProvider>
        <HomeContent />
      </MusicPlayerProvider>
    </GameProvider>
  );
}

function HomeContent() {
  const { dataLoaded } = useGame();
  const { userId, logout } = useAuth();
  const [page, setPage] = useState<PageId>('home');

  const switchPage = (id: PageId) => {
    setPage(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 深蓝渐变 Header */}
      <header className="bp-header relative overflow-hidden text-white">
        <div className="bp-header-skew" />
        <div className="bp-header-grid" />
        {/* 角落刻度装饰 */}
        <div className="bp-corner-tick top-3 left-3 border-t border-l" />
        <div className="bp-corner-tick top-3 right-3 border-t border-r" />
        <div className="bp-corner-tick bottom-3 left-3 border-b border-l" />
        <div className="bp-corner-tick bottom-3 right-3 border-b border-r" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-14 md:pt-14 md:pb-16">
          {/* 品牌标识栏 */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <span className="text-[#0033a0] text-sm font-black tracking-tight">BP</span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              Achievement Tracking System
            </span>
            <div className="ml-auto flex items-center gap-3 md:gap-5">
              {/* 用户信息 */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/15">
                  <User className="w-3 h-3 text-white/60" />
                  <span className="text-[11px] font-bold text-white max-w-[120px] truncate">
                    {userId}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/15 hover:bg-white/20 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-3 h-3 text-white/70" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                    退出
                  </span>
                </button>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  报告周期
                </div>
                <div className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-sm">
                  进行中
                </div>
              </div>
            </div>
          </div>

          {/* 主标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-3">
                TASK ACHIEVEMENT PROGRAM
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2">
                任务成就激励系统
              </h1>
              <p className="text-sm font-medium text-white/70 max-w-xl">
                每完成一个任务，解锁新成就，追踪你的成长路径
              </p>
            </div>

            <TodayBadge />
          </motion.div>
        </div>

        {/* 底部边线 */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />
      </header>

      {/* 导航栏 - sticky 吸顶 */}
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-[0_1px_8px_rgba(0,51,160,0.05)]">
        <div className="max-w-7xl mx-auto px-2 md:px-8 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SubTabBar
                tabs={PAGES.map((p) => ({ id: p.id, label: p.label, emoji: p.emoji }))}
                active={page}
                onChange={(id) => switchPage(id as PageId)}
              />
            </div>
            <div className="hidden md:flex items-center gap-2 pl-4 shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                当前板块
              </span>
              <span className="text-[10px] font-black text-[#0033a0]">
                {PAGES.find((p) => p.id === page)?.emoji} {PAGES.find((p) => p.id === page)?.label}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 - 负 margin 重叠效果 */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 -mt-6 md:-mt-8 pb-20 relative">
        {!dataLoaded ? (
          <div className="report-card p-10 flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#0033a0] border-t-transparent"
            />
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              正在加载你的数据...
            </div>
          </div>
        ) : (
          <>
            {/* ============ 首页：仪表盘 ============ */}
            {page === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                {/* 顶部玩家信息仪表板 */}
                <PlayerStatsBar />

                {/* 称号装备栏 */}
                <div className="mt-4">
                  <TitleEquipPanel />
                </div>

                {/* 任务录入与追踪 */}
                <section className="mt-12">
                  <SectionHeading index="01" code="TASK LOGGING" title="任务录入与历史追踪" />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                      <TaskInputSection />
                    </div>

                    <div className="lg:col-span-7">
                      <TaskHistorySection />
                    </div>
                  </div>
                </section>

                {/* 宠物与运势 */}
                <section className="mt-12">
                  <SectionHeading index="02" code="PET & FORTUNE" title="任务宠物与每日运势" />
                  <PetFortuneBar />
                </section>
              </motion.div>
            )}

            {/* ============ 成就页 ============ */}
            {page === 'achievements' && (
              <motion.div key="achievements" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="03" code="ACHIEVEMENT FRAMEWORK" title="成就徽章体系与进度追踪" />
                  <AchievementSection />
                </section>

                <section className="mt-12">
                  <SectionHeading index="04" code="FUNNY HALL OF FAME" title="趣味吐槽墙与今日语录" />
                  <FunnyHallSection />
                </section>

                <section className="mt-12">
                  <SectionHeading index="05" code="WEEKLY REPORT" title="本周战绩与教练锐评" />
                  <WeeklyReportCard />
                </section>
              </motion.div>
            )}

            {/* ============ 音乐页 ============ */}
            {page === 'music' && (
              <motion.div key="music" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="06" code="MUSIC PLAYER" title="音乐播放器与歌单" />
                  <MusicSection />
                </section>
              </motion.div>
            )}

            {/* ============ 搜歌页 ============ */}
            {page === 'search' && (
              <motion.div key="search" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="04" code="MUSIC SEARCH" title="全网搜歌：网易云 · QQ音乐 · B站" />
                  <MusicSearchSection />
                </section>
              </motion.div>
            )}

            {/* ============ B站页 ============ */}
            {page === 'bili' && (
              <motion.div key="bili" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="05" code="BILIBILI PARSER" title="B站视频解析与下载" />
                  <BiliSection />
                </section>
              </motion.div>
            )}

            {/* ============ 模型库页 ============ */}
            {page === 'models' && (
              <motion.div key="models" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="06" code="3D MODEL LIBRARY" title="绝区零模型库：角色 · 皮肤 · 武器" />
                  <ModelSection />
                </section>
              </motion.div>
            )}

            {/* ============ 桌宠页 ============ */}
            {page === 'pet' && (
              <motion.div key="pet" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="07" code="DESKTOP PET" title="桌宠：3D 角色 · AI 对话 · 悬浮显示" />
                  <PetSection />
                </section>
              </motion.div>
            )}

            {/* ============ AI 页 ============ */}
            {page === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="07" code="AI SPACE" title="AI 聊天与角色扮演" />
                  <AIChatSection />
                </section>
              </motion.div>
            )}

            {/* ============ 社区页 ============ */}
            {page === 'community' && (
              <motion.div key="community" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="08" code="COMMUNITY" title="聊天室 · 留言墙 · 用户广场" />
                  <CommunitySection />
                </section>
              </motion.div>
            )}

            {/* ============ 游戏页 ============ */}
            {page === 'games' && (
              <motion.div key="games" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="09" code="GAME ROOM" title="娱乐放松小游戏" />
                  <GamesSection />
                </section>
              </motion.div>
            )}

            {/* ============ 目标页 ============ */}
            {page === 'goals' && (
              <motion.div key="goals" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="10" code="GOALS & REWARDS" title="设立目标，奖励自己" />
                  <GoalsSection />
                </section>
              </motion.div>
            )}

            {/* ============ 生活页 ============ */}
            {page === 'life' && (
              <motion.div key="life" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="11" code="LIFESTYLE" title="生活百宝箱：专注 · 记录 · 治愈" />
                  <LifestyleSection />
                </section>
              </motion.div>
            )}

            {/* ============ 工具页 ============ */}
            {page === 'tools' && (
              <motion.div key="tools" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="12" code="TOOLBOX" title="实用小工具：转盘 · 求签 · 涂鸦" />
                  <ToolsSection />
                </section>
              </motion.div>
            )}

            {/* ============ 趣味页 ============ */}
            {page === 'fun' && (
              <motion.div key="fun" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="13" code="FUN CORNER" title="趣味百科：笑话 · 成语 · 语录" />
                  <FunSection />
                </section>
              </motion.div>
            )}

            {/* ============ 测试页 ============ */}
            {page === 'quiz' && (
              <motion.div key="quiz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="14" code="QUIZ & FORTUNE" title="运势与趣味测试" />
                  <QuizSection />
                </section>
              </motion.div>
            )}

            {/* ============ 创作页 ============ */}
            {page === 'creative' && (
              <motion.div key="creative" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="15" code="CREATIVE STUDIO" title="创作工坊：二维码 · 思维导图 · 流程图" />
                  <CreativeSection />
                </section>
              </motion.div>
            )}

            {/* ============ 数据页 ============ */}
            {page === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="13" code="PERFORMANCE OVERVIEW" title="核心指标一览" />
                  <QuickStatsRow />
                </section>

                <section className="mt-12">
                  <SectionHeading index="14" code="DATA INSIGHTS" title="多维数据可视化" />
                  <Suspense
                    fallback={
                      <div className="report-card p-6 h-40 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          图表加载中...
                        </span>
                      </div>
                    }
                  >
                    <StatsChartsSection />
                  </Suspense>
                </section>
              </motion.div>
            )}

            {/* ============ 管理页 ============ */}
            {page === 'manage' && (
              <motion.div key="manage" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <section className="pt-8">
                  <SectionHeading index="17" code="DATA MANAGEMENT" title="备份、恢复与重置" />
                  <DataManageSection />
                </section>

                <section className="mt-12">
                  <SectionHeading index="18" code="PASSWORD RESET REVIEW" title="密码重置审核" />
                  <ResetReviewPanel />
                </section>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bp-header text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">
                BLUEPRINT ACHIEVEMENT SYSTEM
              </div>
              <div className="text-[10px] text-white/40">
                任务成就激励系统 · 数据按账号隔离存储于 MySQL
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/50">
              <span>v2.0</span>
              <span className="text-white/20">|</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 成就解锁弹窗 */}
      <AchievementCelebration />

      {/* 搞笑成就浮层 */}
      <FunnyCelebration />

      {/* 底部音乐播放条 */}
      <MusicPlayerBar />
    </div>
  );
}

function TodayBadge() {
  const { progress } = useGame();
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/15">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
        今日已完成
      </span>
      <span className="text-lg font-black text-white tabular-nums leading-none">
        {progress.dailyTaskCount}
      </span>
      <span className="text-[10px] text-white/50">个任务</span>
    </div>
  );
}

function SectionHeading({ index, code, title }: { index: string; code: string; title: string }) {
  return (
    <div className="mb-6 flex items-end gap-4">
      <div className="w-9 h-9 bg-[#0033a0] text-white flex items-center justify-center text-xs font-black">
        {index}
      </div>
      <div>
        <div className="section-label">{code}</div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">{title}</h2>
      </div>
    </div>
  );
}

/** 核心指标概览 */
function QuickStatsRow() {
  const { progress, tasks } = useGame();
  const stats = [
    { icon: <Target className="w-3.5 h-3.5" />, label: '总任务数', value: String(progress.totalTasks), sub: `${tasks.length} 条记录` },
    { icon: <Award className="w-3.5 h-3.5" />, label: '成就数', value: String(progress.unlockedAchievementIds.length), sub: `共 ${29} 枚` },
    { icon: <Calendar className="w-3.5 h-3.5" />, label: '当前连续', value: `${progress.streakDays}d`, sub: `最长 ${progress.longestStreak}d` },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: '总积分', value: String(progress.totalPoints), sub: `Lv.${progress.level}` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="report-card p-4"
        >
          <div className="flex items-center gap-1.5 text-[#0033a0] mb-2">
            {s.icon}
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
          </div>
          <div className="text-2xl font-black text-slate-800 tabular-nums leading-none mb-1">{s.value}</div>
          <div className="text-[9px] font-bold text-slate-300">{s.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}
