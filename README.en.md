# 🏆 Task Achievement System

[简体中文](./README.md) | English

A feature-rich task & achievement motivation platform: complete tasks to earn experience points, unlock achievement badges, raise a virtual pet — plus music player, AI chat, community, mini-games, 3D model library and a desktop pet, in 18 feature modules.

## ✨ Features

| Module | Description |
|---|---|
| 🏠 Home | Task check-in, 30+ achievements, pet raising, daily fortune, weekly report, title system |
| 🎵 Music | 92+ songs, upload review, playlist sharing (6-char share code), player bar |
| 🔍 Music Search | Cross-platform search (NetEase/QQ/Bilibili), Bilibili playable & downloadable |
| 📺 Bilibili Parser | BV parsing, multi-part download, video/audio/merged modes (ffmpeg) |
| 🧊 Model Library | 3D model viewer (three.js), characters/skins/weapons, position adjust |
| 🐟 Desktop Pet | Webmeji floating pet (visible on all pages) + AI chat |
| 🤖 AI | OpenAI-compatible API, 7 built-in personas, custom character cards |
| 💬 Community | Chat room, message wall, user plaza, announcements, admin system |
| 🎮 Games | 10+ mini-games: Snake/2048/Gomoku/Tic-Tac-Toe etc., zoomable |
| 🎯 Goals | Goals + rewards with progress tracking |
| 🌿 Lifestyle | Pomodoro/check-in calendar/diary/mood/wishing pool/countdown, 11 items |
| 🛠️ Tools | 31 tools: Bilibili parser/mortgage calculator/emoji/base converter etc. |
| 😂 Fun | 15 content pools: jokes/idioms/riddles/soul chicken soup etc. |
| 🧪 Tests | 15 tests: zodiac/tarot/psychology quizzes etc. |
| 🎨 Creative | QR code/Mermaid/mind map/Markdown/3D model preview etc. |
| 📊 Analytics | echarts visualization, data backup & restore |
| ⚙️ Admin | Password reset review, admin panel |

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **3D**: three.js + @google/model-viewer
- **Charts**: echarts (lazy-loaded chunks)
- **Animation**: framer-motion + GSAP
- **Backend**: Node.js (native http module, zero framework)
- **Database**: MySQL 8.0 (default) / SQLite (better-sqlite3, zero dependency)

## 🗄️ Dual Storage Engines

| | MySQL (default) | SQLite (no MySQL) |
|---|---|---|
| Start | `node deploy/linux/linux-server.mjs` | `DB_ENGINE=sqlite node deploy/linux/linux-server.mjs` |
| Data | MySQL database (rxy) | Single file `data/app.sqlite` (auto-created, zero config) |
| Use case | Multi-user / production | Personal / lightweight / no MySQL environment |
| Schema | migrations/*.sql | Auto-created (full schema built-in) |

Both engines share the same API and business code — switch with one environment variable.
- **Desktop pet**: Webmeji (open-source Shimeji style)

## 🚀 Quick Start

### Requirements

- Node.js 18+
- MySQL 8.0+
- ffmpeg (optional, for Bilibili merged video download)

### 1. Initialize Database

```bash
mysql -uroot -p < migrations/migrate_v1.sql   # base tables
mysql -uroot -p < migrations/migrate_v2.sql   # music/AI/review
mysql -uroot -p < migrations/migrate_v3.sql   # community
mysql -uroot -p < migrations/migrate_v4.sql   # generic extensions
mysql -uroot -p < migrations/migrate_v5.sql   # playlist share code / password reset
```

### 2. Configure Environment

```bash
cp deploy/linux/.env.example deploy/linux/.env
# Edit .env: database password, APP_KEY (custom key for AES-encrypting user API keys)
```

### 3. Frontend

```bash
npm install        # or add --registry=https://registry.npmmirror.com for CN mirror
npm run dev        # dev mode http://localhost:5173
npm run build      # production build → dist/
```

### 4. Backend

```bash
cd deploy/linux
node linux-server.mjs    # production server (static + API), default port 8889
```

## 📁 Project Structure

```
├── src/                  # Frontend source
│   ├── components/       # Shared components (SubTabBar/ThreeModelViewer/PetWidget)
│   ├── pages/            # Pages (login/main frame/feature modules)
│   │   └── HomePage/sections/   # 18 feature modules
│   ├── contexts/         # React Context (Auth/Game)
│   ├── data/             # Frontend data engines (achievements/pet/fortune/titles)
│   └── components/ui/    # shadcn/ui components
├── server/               # Backend API (Node native http)
│   ├── api.mjs           # Main router: auth/data/admin
│   ├── music-api.mjs     # Music/playlists/review
│   ├── ai-api.mjs        # AI chat (SSE)/personas/config (AES encrypted)
│   ├── bili-api.mjs      # Bilibili parser/download/ffmpeg merge
│   ├── msearch-api.mjs   # Cross-platform music search
│   ├── community-api.mjs # Community/generic storage
│   └── crypto.mjs        # AES-256-GCM encryption
├── migrations/           # DB migration scripts (v1 base + v2~v5 increments)
├── deploy/linux/         # Linux production deployment (systemd + static serving)
├── public/               # Static assets
└── tools/                # Server-side open-source tools (sakana/webmeji/sql2er etc.)
```

## 🔒 Security

- Passwords stored as scrypt salted hashes
- API keys AES-256-GCM encrypted (key from env APP_KEY)
- Sessions: 256-bit random tokens, 7-day expiry, in-memory only
- Login rate limiting (per-IP, 5 attempts/min lockout)
- Password reset requires admin approval

## ⚖️ License

MIT

## 👤 Authors

- Author: **yvhcel888**
- Co-author: **QingXue-Han**

## 🙏 Credits

- [Webmeji](https://github.com/lars-rooij/webmeji) — desktop pet
- [Sakana](https://github.com/itorr/sakana) — pet simulator
- [three.js](https://github.com/mrdoob/three.js) / [model-viewer](https://github.com/google/model-viewer) — 3D rendering
- [echarts](https://github.com/apache/echarts) — data visualization
- All model/material copyrights belong to their original authors
