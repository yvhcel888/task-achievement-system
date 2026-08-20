# 🏆 任务成就激励系统 · Task Achievement System

[English](./README.en.md) | 简体中文

一个功能丰富的任务成就激励平台：完成任务获得经验积分、解锁成就徽章、养成虚拟宠物，还有音乐播放、AI 聊天、社区互动、小游戏、3D 模型库、桌宠等 18 个功能板块。

## ✨ 功能特性

| 板块 | 说明 |
|---|---|
| 🏠 首页 | 任务打卡、成就徽章(30+)、宠物养成、每日运势、周报、称号系统 |
| 🎵 音乐 | 92+ 首音乐、上传审核、歌单分享(6 位分享码)、播放条 |
| 🔍 搜歌 | 全网搜索(网易云/QQ音乐/B站),B站可在线播放+下载 |
| 📺 B站解析 | BV 号解析、分P下载、视频/音频/合并三种下载模式(ffmpeg) |
| 🧊 模型库 | 3D 模型展示(three.js),角色/皮肤/武器分类,位置调节 |
| 🐟 桌宠 | Webmeji 悬浮桌宠(所有页面可见)+ AI 对话 |
| 🤖 AI | OpenAI 兼容 API 接入、7 种内置人设、自定义角色卡 |
| 💬 社区 | 聊天室、留言墙、用户广场、公告、管理员系统 |
| 🎮 游戏 | 10+ 小游戏:贪吃蛇/2048/五子棋/井字棋等,支持放大缩小 |
| 🎯 目标 | 目标+奖励,进度跟踪 |
| 🌿 生活 | 番茄钟/打卡日历/日记/心情/许愿池/倒数日等 11 项 |
| 🛠️ 工具 | 31 个工具:B站解析/房贷计算器/emoji/进制转换等 |
| 😂 趣味 | 15 类内容池:笑话/成语/谜语/毒鸡汤等 |
| 🧪 测试 | 15 项测试:星座/塔罗/心理测验等 |
| 🎨 创作 | 二维码/Mermaid图/思维导图/Markdown/3D模型预览等 |
| 📊 数据 | echarts 统计可视化、数据备份恢复 |
| ⚙️ 管理 | 密码重置审核、管理员面板 |

## 🛠 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **3D**: three.js + @google/model-viewer
- **图表**: echarts(按需懒加载分包)
- **动画**: framer-motion + GSAP
- **后端**: Node.js(原生 http 模块,零框架)
- **数据库**: MySQL 8.0(默认) / SQLite 无数据库版(better-sqlite3,零依赖)

## 🗄️ 双存储引擎

| | MySQL 版(默认) | SQLite 版(无 MySQL) |
|---|---|---|
| 启动 | `node deploy/linux/linux-server.mjs` | `DB_ENGINE=sqlite node deploy/linux/linux-server.mjs` |
| 数据 | MySQL 数据库(rxy) | 单文件 `data/app.sqlite`(自动建表,零配置) |
| 适用 | 多用户/生产部署 | 个人使用/轻量部署/无 MySQL 环境 |
| 表结构 | migrations/*.sql | 自动创建(全量 schema 内置) |

两种引擎共享同一套 API 与业务代码,切换只需一个环境变量。
- **桌宠**: Webmeji(开源 Shimeji 风格)

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- ffmpeg(可选,B站视频合并下载用)

### 1. 初始化数据库

```bash
# 按顺序执行迁移脚本(migrations/ 目录)
mysql -uroot -p < migrations/migrate_v1.sql   # 基础建库
mysql -uroot -p < migrations/migrate_v2.sql   # 音乐/AI/审核
mysql -uroot -p < migrations/migrate_v3.sql   # 社区
mysql -uroot -p < migrations/migrate_v4.sql   # 通用扩展
mysql -uroot -p < migrations/migrate_v5.sql   # 歌单分享码/密码重置
```

### 2. 配置环境变量

```bash
cp deploy/linux/.env.example deploy/linux/.env
# 编辑 .env:填写数据库密码、APP_KEY(自定义密钥,用于 AES 加密用户 API Key)
```

### 3. 前端

```bash
npm install        # 依赖安装(可加 --registry=https://registry.npmmirror.com 加速)
npm run dev        # 开发模式 http://localhost:5173
npm run build      # 生产构建 → dist/
```

### 4. 后端

```bash
cd deploy/linux
node linux-server.mjs    # 生产服务器(静态+API),默认端口 8889
# 或开发调试:
node server/api.mjs
```

## 📁 项目结构

```
├── src/                  # 前端源码
│   ├── components/       # 通用组件(SubTabBar/ThreeModelViewer/PetWidget)
│   ├── pages/            # 页面(登录/主框架/各功能板块)
│   │   └── HomePage/sections/   # 18 个功能板块
│   ├── contexts/         # React Context(Auth/Game)
│   ├── data/             # 前端数据引擎(成就/宠物/运势/称号)
│   └── components/ui/    # shadcn/ui 组件
├── server/               # 后端 API(Node 原生 http)
│   ├── api.mjs           # 主路由:认证/数据/管理
│   ├── music-api.mjs     # 音乐/歌单/审核
│   ├── ai-api.mjs        # AI 聊天(SSE)/人设/配置(AES加密)
│   ├── bili-api.mjs      # B站解析/下载/ffmpeg合并
│   ├── msearch-api.mjs   # 多平台音乐搜索
│   ├── community-api.mjs # 社区/扩展存储
│   └── crypto.mjs        # AES-256-GCM 加解密
├── migrations/           # 数据库迁移脚本(v1 建库 + v2~v5 增量)
├── deploy/linux/         # Linux 生产部署(systemd + 静态服务)
├── public/               # 静态资源
└── tools/                # 服务器端独立开源工具(sakana/webmeji/sql2er 等)
```

## 🔒 安全设计

- 密码 scrypt 加盐哈希存储
- API Key AES-256-GCM 加密存储(密钥来自环境变量 APP_KEY)
- 会话:256 位随机 token,7 天过期,仅存服务端内存
- 登录限速(IP 维度,5 次/分钟锁定)
- 密码重置需管理员审核

## ⚖️ License

MIT

## 👤 作者

- 作者:**yvhcel888**
- 共同作者:**QingXue-Han**

## 🙏 致谢

- [Webmeji](https://github.com/lars-rooij/webmeji) — 桌宠
- [Sakana](https://github.com/itorr/sakana) — 桌宠模拟器
- [three.js](https://github.com/mrdoob/three.js) / [model-viewer](https://github.com/google/model-viewer) — 3D 渲染
- [echarts](https://github.com/apache/echarts) — 数据可视化
- 所有模型/素材版权归原作者所有
