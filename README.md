# EmboHub 项目说明

## 项目概述
- 目标：在局域网内提供一个极简模型仓库，支持用户注册/登录、模型创建与检索、文件上传/下载、基础统计、管理员管理与下载流量监控。
- 技术栈：
  - 后端：FastAPI + SQLAlchemy + Pydantic v2
  - 存储：本地文件
  - 前端：原生 HTML/CSS/JS 单页式界面

## 目录结构
```
EmboHub/
├─ backend/                    # 后端服务
│  ├─ app/
│  │  ├─ main.py               # FastAPI 应用入口、路由挂载、静态资源挂载
│  │  ├─ config.py             # 配置项与环境变量读取
│  │  ├─ database.py           # DB 引擎、会话、Base 声明
│  │  ├─ models.py             # ORM 模型（User/Model/Version/File/Event）
│  │  ├─ auth.py               # 认证鉴权（JWT、密码哈希、依赖）
│  │  ├─ storage.py            # 文件存储读写与 S3 客户端封装
│  │  ├─ routers/
│  │  │  ├─ auth.py            # 用户注册/登录/当前用户
│  │  │  ├─ models.py          # 模型 CRUD、文件上传/列表
│  │  │  ├─ files.py           # 文件下载（流式/重定向）、文件删除
│  │  │  ├─ traffic.py         # 下载流量监控接口
│  ├─ requirements.txt         # 后端依赖
├─ web/                        # 前端 UI（静态资源）
│  ├─ index.html               # 顶部导航 + 内容挂载点
│  ├─ style.css                # 样式（卡片、栅格、按钮、导航）
│  ├─ app.js                   # 前端路由与页面逻辑
├─ scripts/
│  ├─ cli-download.sh          # Bash 脚本：命令行登录、检索与批量下载
├─ app.db                      # 默认 SQLite 数据库（可切换到 MySQL）
└─ README.md                   # 项目说明（本文件）
```

## 配置与运行
- 环境变量：
  - `DB_URL`：数据库连接串（默认 `sqlite:///./app.db`；示例 MySQL：`mysql+pymysql://user:pass@host:3306/db`）
  - `STORAGE_DIR`：本地文件存储目录（默认 `./storage`）
  - `S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY/S3_SECRET_KEY/S3_SECURE`：S3 兼容对象存储配置
  - `ADMIN_USERNAME/ADMIN_PASSWORD`：默认管理员账号（未提供时为 `admin/admin123`）
- 启动（示例使用 MySQL）：
```
export DB_URL="mysql+pymysql://root:853211@127.0.0.1:3306/embohub"
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- 访问：
  - 前端 UI：`http://127.0.0.1:8000/ui/`
  - API 根：`http://127.0.0.1:8000/`

## 模块拆解
- `backend/app/main.py`
  - 初始化数据库表，创建默认管理员
  - 挂载路由：`auth/models/files/traffic`
  - 跨域设置与静态资源挂载（绝对路径）
- `backend/app/models.py`
  - `User`：账户信息与角色
  - `Model`：模型基本信息、下载计数、关联 `Version`
  - `Version`：模型版本（当前收敛为单版本 `single`）
  - `File`：上传的模型文件元信息（大小、哈希、存储地址等）
  - `Event`：预留事件记录（统计扩展）
- `backend/app/auth.py`
  - 密码哈希与校验、JWT 发放与依赖 `get_current_user`
- `backend/app/storage.py`
  - 本地文件保存与 S3 客户端封装、URI 解析（`s3://bucket/key`）
- `backend/app/routers/auth.py`
  - 注册、登录、当前用户查询
- `backend/app/routers/models.py`
  - 模型创建、检索列表、详情、文件上传与列表
  - 管理员删除模型（级联清理版本与文件、本地或 S3）
- `backend/app/routers/files.py`
  - 文件下载：本地文件流式下载（进度上报）或 S3 直链重定向
  - 文件删除：记录与存储清理
- `backend/app/routers/traffic.py`
  - 下载流量监控：返回当前活动下载列表及进度
- `web/index.html / style.css / app.js`
  - 顶部导航（模型/新建/我的/统计/管理/流量监控）
  - 登录态展示（右侧用户名/退出，未登录显示登录按钮）
  - 页面：模型浏览、模型详情、创建并多文件上传、我的、统计、管理（删除）、流量监控（轮询进度）
- `scripts/cli-download.sh`
  - 登录获取 token → 按关键词/标识检索 → 列出文件 → 批量下载并跟随重定向

## 接口说明

### 认证
- `POST /auth/register`
  - 请求：`{ "username": string, "password": string }`
  - 响应：`{ "id": number, "username": string, ... }`
- `POST /auth/login`
  - 请求：`{ "username": string, "password": string }`
  - 响应：`{ "access_token": string, "token_type": "bearer" }`
- `GET /auth/me`
  - 头：`Authorization: Bearer <token>`
  - 响应：`{ id, username, role, created_at }`

### 模型
- `GET /models`
  - 查询参数：
    - `query`（关键词匹配 name/slug，可选）
    - `tags`（逗号分隔，可选）
    - `sort`（`updated_at` 或 `downloads`，可选）
  - 响应：`[{ id, name, slug, owner_id, description, tags, download_count, ... }]`
- `POST /models`
  - 头：`Authorization`
  - 请求：`{ name, slug, description?, tags? }`
  - 响应：`{ id, ... }`
- `GET /models/{id}`
  - 响应：模型详情
- `GET /models/{id}/files`
  - 响应：`[{ id, filename, size, sha256, mime, ... }]`
- `POST /models/{id}/upload`
  - 头：`Authorization`
  - 表单：`f: File`（支持多次上传形成多文件）
  - 响应：文件记录
- `DELETE /models/{model_id}`（管理员）
  - 头：`Authorization`
  - 动作：删除模型记录、关联版本与文件，并清理本地/S3 存储
  - 响应：`{ ok: true }`

### 文件
- `GET /files/{file_id}/download`
  - 本地存储：流式下载（`StreamingResponse`），并更新下载计数与监控进度
  - S3 存储：返回一次性直链（`RedirectResponse`）
- `DELETE /files/{file_id}`
  - 头：`Authorization`（建议限制为管理员或所有者）
  - 动作：删除文件记录与存储对象

### 系统
- `GET /system/health`
  - 响应：`{ db: "ok"|"error", storage_dir: string }`
- `GET /system/traffic`（管理员）
  - 响应：
    ```json
    {
      "active": [
        {
          "file_id": 8,
          "filename": "model.bin",
          "bytes": 1048576,
          "total": 5242880,
          "percent": 20,
          "started_at": "2025-12-04T10:00:00Z"
        }
      ],
      "capacity": 5,
      "active_count": 1
    }
    ```

## 前端页面说明
- 模型浏览：关键词、标签、排序检索；列表项显示名称、下载数、标识与标签
- 详情页：名称、简介、标识、标签、文件清单（下载）
- 新建页：
  - 仅保留“创建并上传”，支持多次选择追加文件、纵向列出文件名、单个删除已选文件
  - 上传完成后跳转至详情
- 我的：统计当前用户模型数量、文件数量、占用存储
- 统计：总模型数、总下载量、仓库大小、热门模型榜（下载列对齐）
- 管理（管理员）：系统状态、删除模型按钮
- 流量监控（管理员）：每秒轮询 `/system/traffic`，显示进行中的下载进度条

## 命令行下载示例
- 脚本：`bash scripts/cli-download.sh bert`
- 环境变量：`BASE_URL USER_NAME USER_PASS SORT`
- 直接 curl：
```
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/login -H 'Content-Type: application/json' -d '{"username":"ops","password":"853211"}' | python -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -s "http://127.0.0.1:8000/models?query=bert"
curl -s "http://127.0.0.1:8000/models/123/files"
curl -L -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8000/files/456/download" -O
```

## 备注与拓展
- 下载并发由 Uvicorn/ASGI 框架与系统限制共同决定；当前监控 `capacity` 值为推荐目标（5）
