# 任务成就激励系统 · Ubuntu 部署指南

服务器环境：Ubuntu 24.04 + MySQL 8.0.46（端口 3306），数据库密码 `<your-db-password>`。

## 0. 前置：Node.js 22

Ubuntu 24.04 apt 自带的 node 18 太老（Vite 8 构建要求 Node 20.19+ / 22.12+），请用 nvm 安装：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v   # 应显示 v22.x
```

## 1. 准备数据库

```bash
# 建库建表（输入 MySQL root 密码 <your-db-password>）
mysql -uroot -p < deploy/linux/setup.sql
# 验证
mysql -uroot -p -e "USE rxy; SHOW TABLES;"
```

> 若提示 `Access denied` 或 auth_socket 问题：`sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '<your-db-password>'; FLUSH PRIVILEGES;"`

## 2. 上传项目并安装依赖

```bash
# 把项目目录上传到服务器（scp / rsync / git clone 均可），例如 /opt/task-achievement
cd /opt/task-achievement
npm ci            # 用 package-lock.json 精确安装（比 npm install 快且稳）
npm run build     # 生产构建，产物在 dist/client
```

## 3. 配置环境变量

```bash
cd deploy/linux
cp .env.example .env
chmod 600 .env    # 保护 MySQL 密码
# 确认内容正确（.env.example 已预填 8889 / root / <your-db-password> / rxy）
cat .env
```

## 4. 启动

### 方式 A：systemd 常驻（推荐）

```bash
# 按实际路径修改 task-achievement.service 里的 WorkingDirectory 与 Node 路径
which node        # 查看 node 实际路径，改到 ExecStart
sudo cp deploy/linux/task-achievement.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now task-achievement
sudo systemctl status task-achievement
journalctl -u task-achievement -f   # 实时日志
```

### 方式 B：直接运行（测试用）

```bash
cd /opt/task-achievement
node deploy/linux/linux-server.mjs &
# 或前台运行看日志
node deploy/linux/linux-server.mjs
```

启动后访问 `http://服务器IP:8889`，首次访问会跳到登录页，注册新账号即可使用。

## 5. 可选：Nginx 反向代理 + 域名

```nginx
server {
    listen 80;
    server_name your.domain.com;
    location / {
        proxy_pass http://127.0.0.1:8889;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 与 Windows 版的关系

- Windows 版（D:\rxy\site）保持原样：vite dev/preview 内嵌 API，数据库 root/123456 作为默认值
- Linux 版共用同一份代码，数据库配置通过 `deploy/linux/.env` 环境变量覆盖（`server/api.mjs` 读取 `DB_*` 变量，不设则用 Windows 默认值）
- 生产服务器 `deploy/linux/linux-server.mjs` 为独立 Node 进程：静态托管 `dist/client` + API，不依赖 Vite

## 故障排查

| 现象 | 处理 |
|---|---|
| 注册时报「服务器错误，请确认 MySQL 已启动」 | 检查 MySQL：`systemctl status mysql`；确认 .env 密码正确 |
| `ER_NOT_SUPPORTED_AUTH_MODE` | mysql2 3.23 已支持 caching_sha2_password，请确认 `npm ci` 安装的 mysql2 版本 ≥ 3 |
| 端口被占用 | 改 .env 的 PORT 或 `sudo ss -lntp \| grep 8889` 查看占用进程 |
| 页面能开但数据不保存 | 浏览器 F12 → Network 看 /api/data 请求是否 401（登录过期，重新登录） |
