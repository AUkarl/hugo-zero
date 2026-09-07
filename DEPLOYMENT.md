# molyun 个人站点 — 部署教程

本教程带你从安装 Hugo 开始，一步步将站点部署到互联网上。

---

## 目录

1. [环境准备](#1-环境准备)
2. [项目结构说明](#2-项目结构说明)
3. [本地运行与预览](#3-本地运行与预览)
4. [站点配置](#4-站点配置)
5. [创建内容](#5-创建内容)
6. [构建站点](#6-构建站点)
7. [部署到 Cloudflare Pages（推荐）](#7-部署到-cloudflare-pages推荐)
8. [部署到 GitHub Pages](#8-部署到-github-pages)
9. [部署到 Netlify](#9-部署到-netlify)
10. [部署到 Vercel](#10-部署到-vercel)
11. [自定义域名绑定](#11-自定义域名绑定)
12. [功能配置指南](#12-功能配置指南)
13. [日常维护](#13-日常维护)
14. [常见问题](#14-常见问题)

---

## 1. 环境准备

### 1.1 安装 Hugo Extended

本主题使用 Hugo Pipes 处理 CSS/JS 资源，**必须使用 Extended 版本**。

**Windows：**
```bash
# 使用 winget（推荐）
winget install Hugo.Hugo.Extended

# 或使用 Chocolatey
choco install hugo-extended

# 或手动下载：
# 访问 https://github.com/gohugoio/hugo/releases
# 下载 hugo_extended_x.xx.x_windows-amd64.zip
# 解压后将 hugo.exe 添加到系统 PATH
```

**macOS：**
```bash
brew install hugo
```

**Linux（Ubuntu/Debian）：**
```bash
# 下载 deb 包（以 0.165.0 为例，请去 GitHub Releases 查看最新版本）
wget https://github.com/gohugoio/hugo/releases/download/v0.165.0/hugo_extended_0.165.0_linux-amd64.deb
sudo dpkg -i hugo_extended_0.165.0_linux-amd64.deb
```

**验证安装：**
```bash
hugo version
# 输出应包含 "extended" 字样，版本 >= 0.100.0
```

### 1.2 安装 Git

```bash
# Windows
winget install Git.Git

# macOS
brew install git

# Linux
sudo apt install git
```

### 1.3 获取项目代码

```bash
# 如果你已有仓库
git clone https://github.com/AUkarl/hugo-home.git
cd hugo-home

# 如果还没有仓库，直接在项目目录操作即可
```

---

## 2. 项目结构说明

```
hugo-home/
├── config/_default/          # 站点配置（核心）
│   ├── config.toml           #   基础配置（baseURL、语言、分页等）
│   ├── menus.toml            #   导航菜单
│   └── params.toml           #   主题参数（全部可配置项）
├── content/                  # 内容文件
│   ├── zh/                   #   中文内容
│   │   ├── home/_index.md    #     主页
│   │   ├── posts/            #     博客文章
│   │   ├── moments/          #     时刻（说说）
│   │   ├── about/_index.md   #     关于页
│   │   ├── archive/_index.md #     归档页
│   │   ├── work/_index.md    #     工坊页
│   │   └── email/_index.md   #     邮件页
│   └── en/                   #   英文内容（结构同上）
├── data/                     # 数据文件
│   ├── authors.yaml          #   作者信息（多作者配置）
│   ├── moments.yaml          #   时刻数据（离线模式）
│   ├── tools.yaml            #   工具页数据
│   └── works.yaml            #   工坊项目数据
├── static/                   # 静态资源（直接复制到站点根目录）
│   ├── img/                  #   图片（logo、头像、背景等）
│   └── fonts/                #   字体文件
├── themes/
│   └── hugo-theme-molyun/    # 主题文件
│       ├── layouts/          #   页面模板
│       ├── assets/           #   CSS/JS 资源
│       ├── i18n/             #   多语言翻译
│       └── archetypes/       #   内容模板
└── hugo.toml                 # （不存在，由 config/ 目录管理）
```

---

## 3. 本地运行与预览

```bash
# 在项目根目录执行
hugo server -D

# 输出示例：
# Web Server is available at http://localhost:1313/
# Press Ctrl+C to stop
```

浏览器打开 `http://localhost:1313` 即可预览。`-D` 参数表示同时渲染草稿文章。

**常用开发命令：**

```bash
# 监听文件变化自动刷新（默认行为）
hugo server -D

# 指定端口
hugo server -D --port 8080

# 允许局域网其他设备访问
hugo server -D --bind 0.0.0.0 --baseURL http://你的IP:1313
```

---

## 4. 站点配置

所有配置集中在 `config/_default/` 目录下。

### 4.1 基础配置 `config.toml`

```toml
baseURL = "https://你的域名.com/"    # 【必填】改为你的实际域名
title = "molyun"                      # 站点标题
theme = "hugo-theme-molyun"           # 主题名（不要改）
defaultContentLanguage = "zh"         # 默认语言

[languages]
  [languages.zh]
    label = "中文"
    contentDir = "content/zh"         # 中文内容目录
    weight = 1
  [languages.en]
    label = "English"
    contentDir = "content/en"         # 英文内容目录
    weight = 2
```

### 4.2 导航菜单 `menus.toml`

菜单项的 `name` 对应 i18n 翻译键值（如 `nav-home`），在 `themes/hugo-theme-molyun/i18n/zh.yaml` 中定义。

```toml
[[main]]
  name = "home"        # i18n 键名
  url = "/home/"
  weight = 1

[[main]]
  name = "moments"
  url = "/moments/"
  weight = 2
```

如需添加新菜单项，复制一个 `[[main]]` 块修改即可。

### 4.3 主题参数 `params.toml`

这是最核心的配置文件，包含所有主题可配置项。按编号分区：

| 编号 | 功能 | 说明 |
|------|------|------|
| 1 | 站点基本信息 | Logo、名称、作者 |
| 2 | 导航栏 | 主题切换、语言切换 |
| 3 | 首页落地页 | 诗词轮播、欢迎语、背景图 |
| 4 | 主页 | 卡片布局、分页 |
| 5 | 文章详情页 | 目录、字数统计、作者栏 |
| 6 | 归档页 | 年份分组、弹幕标签云 |
| 7 | 时刻页 | 在线发布模式 / 离线展示模式 |
| 8 | 评论系统（文章页） | Waline / Giscus / Twikoo / Artalk |
| 9 | 网站统计 | Google Analytics / 百度统计 |
| 10 | 页脚 | 版权、服务链接、社交链接 |
| 11 | 关于页面 | 头像、联系方式、友链 |
| 12 | 邮件页面 | 邮箱登录配置 |
| 13 | 工具页面 | 工具列表 |
| 14 | 工坊页面 | 项目列表 |
| 15 | RSS | RSS 订阅配置 |
| 16 | SEO | 搜索引擎优化 |
| 17 | 自定义扩展 | 自定义 CSS/JS/HTML |
| 18 | 文章作者栏 | 作者卡片配置 |

**首次部署必须修改的项：**

```toml
# 1. Logo 和站点名称
logo = "/img/logo.png"
site_name = "你的站点名"

# 2. 作者信息
author = "你的名字"

# 3. 社交链接（改为你的账号）
[[footer.social_row1]]
  name = "GitHub"
  link = "https://github.com/你的用户名"

# 4. 评论系统（选择一种并填写配置）
[comment.article]
  provider = "giscus"    # 或 waline / twikoo / artalk
```

---

## 5. 创建内容

### 5.1 新建博客文章

```bash
hugo new posts/my-first-post.md
# 或指定语言
hugo new zh/posts/my-first-post.md
```

编辑生成的文件：

```markdown
---
title: "我的第一篇文章"
date: 2026-09-06
draft: false
description: "文章摘要描述"
categories:
  - "技术"
tags:
  - "Hugo"
  - "博客"
image: "https://example.com/cover.jpg"   # 封面图（可选）
author: "zhizhi"                         # 作者 ID（对应 data/authors.yaml）
toc: true                                # 是否显示目录
math: false                              # 是否启用数学公式
---

这里写文章正文，支持 Markdown 格式。

## 二级标题

正文内容...
```

### 5.2 新建时刻（说说）

时刻页支持两种模式（见下方[功能配置指南](#121-时刻页两种模式)），数据通过 `data/moments.yaml` 管理：

```yaml
# data/moments.yaml
- id: "moment_1"
  text: "今天天气真好，记录一下此刻的心情。"
  images:
    - "https://example.com/photo1.jpg"
  time: "2026-09-06 10:30"
  nickname: "知止"
  avatarUrl: "/img/avatar.png"
```

### 5.3 内容 Front Matter 字段说明

**文章 (posts)：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 文章标题 |
| date | date | 是 | 发布日期 |
| draft | bool | 否 | 是否为草稿（默认 true） |
| description | string | 否 | 文章摘要/SEO 描述 |
| categories | []string | 否 | 分类列表 |
| tags | []string | 否 | 标签列表 |
| image | string | 否 | 封面图 URL |
| author | string | 否 | 作者 ID |
| toc | bool | 否 | 显示目录 |
| math | bool | 否 | 启用 KaTeX 数学公式 |

**时刻 (moments)：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | date | 是 | 发布时间 |
| draft | bool | 否 | 是否为草稿 |
| images | []string | 否 | 图片列表 |

---

## 6. 构建站点

```bash
# 构建生产版本（不包含草稿）
hugo

# 输出：
# public/ 目录包含所有生成的静态文件
```

构建完成后，`public/` 目录就是可以部署到任何 Web 服务器的完整站点。

**构建选项：**

```bash
# 包含草稿
hugo -D

# 清理旧文件后构建
hugo --cleanDestinationDir

# 构建并显示详细输出
hugo -v
```

---

## 7. 部署到 Cloudflare Pages（推荐）

Cloudflare Pages 提供免费、快速的全球 CDN，非常适合 Hugo 站点。

### 7.1 前置准备

1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up) 账号
2. 将代码推送到 GitHub/GitLab

### 7.2 推送代码到 GitHub

```bash
cd hugo-home

# 项目已包含 .gitignore，构建产物（public/、resources/）不会被提交
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建仓库后
git remote add origin https://github.com/你的用户名/hugo-home.git
git branch -M main
git push -u origin main
```

### 7.3 连接 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 配置构建设置：

| 设置项 | 值 |
|--------|-----|
| Framework preset | `Hugo` |
| Build command | `hugo` |
| Build output directory | `public` |
| Environment variables | `HUGO_VERSION` = `0.165.0` |

5. 点击 **Save and Deploy**

首次部署约 1-2 分钟，之后每次 `git push` 会自动重新部署。

### 7.4 绑定自定义域名

1. Cloudflare Dashboard → Workers & Pages → 你的项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `molyun.com`）
4. 按提示添加 DNS 记录（如果域名已在 Cloudflare 管理，会自动配置）

---

## 8. 部署到 GitHub Pages

### 8.1 使用 GitHub Actions 自动部署

在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Hugo site to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: '0.165.0'
          extended: true

      - name: Build
        run: hugo --minify

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 8.2 启用 GitHub Pages

1. 仓库 → **Settings** → **Pages**
2. Source 选择 **GitHub Actions**
3. 推送代码后自动构建部署

### 8.3 访问地址

- 默认：`https://你的用户名.github.io/仓库名/`
- 需要在 `config.toml` 中设置对应的 `baseURL`：

```toml
baseURL = "https://你的用户名.github.io/仓库名/"
```

---

## 9. 部署到 Netlify

### 9.1 通过 Netlify UI 部署

1. 注册 [Netlify](https://app.netlify.com/signup) 账号
2. 点击 **Add new site** → **Import an existing project**
3. 选择 GitHub/GitLab 仓库
4. 配置构建：

| 设置项 | 值 |
|--------|-----|
| Build command | `hugo` |
| Publish directory | `public` |
| Environment variable | `HUGO_VERSION` = `0.165.0` |

5. 点击 **Deploy site**

### 9.2 使用 Netlify CLI 部署

```bash
# 安装 CLI
npm install -g netlify-cli

# 登录
netlify login

# 初始化并部署
netlify init
netlify deploy --prod
```

### 9.3 添加 netlify.toml（可选）

在项目根目录创建 `netlify.toml`：

```toml
[build]
  publish = "public"
  command = "hugo"

[build.environment]
  HUGO_VERSION = "0.165.0"

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

---

## 10. 部署到 Vercel

### 10.1 通过 Vercel UI 部署

1. 注册 [Vercel](https://vercel.com/signup) 账号
2. 点击 **Add New** → **Project**
3. 导入 GitHub 仓库
4. Vercel 会自动检测 Hugo，确认配置：

| 设置项 | 值 |
|--------|-----|
| Framework Preset | `Hugo` |
| Build Command | `hugo` |
| Output Directory | `public` |
| Install Command | （留空） |

5. 添加环境变量：`HUGO_VERSION` = `0.165.0`
6. 点击 **Deploy**

### 10.2 使用 Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 11. 自定义域名绑定

### 11.1 域名 DNS 配置

无论使用哪个平台，绑定自定义域名的核心步骤：

1. 在部署平台添加自定义域名
2. 平台会给出需要添加的 DNS 记录
3. 到你的域名注册商（如阿里云、Cloudflare）添加对应记录

**常见 DNS 记录类型：**

| 记录类型 | 主机记录 | 记录值 | 用途 |
|----------|----------|--------|------|
| CNAME | `@` 或 `www` | 平台提供的地址 | 指向部署平台 |
| A | `@` | 平台提供的 IP | 直接指向 IP |
| TXT | `_acme-challenge` | 平台提供的值 | SSL 证书验证 |

### 11.2 HTTPS/SSL 证书

- **Cloudflare Pages**：自动签发，无需操作
- **GitHub Pages**：勾选 **Enforce HTTPS** 即可
- **Netlify**：自动签发 Let's Encrypt 证书
- **Vercel**：自动签发

---

## 12. 功能配置指南

### 12.1 时刻页两种模式

时刻页支持两种截然不同的模式，通过 `params.toml` 中的 `[moment]` 配置控制。

#### 在线发布模式 (`online_publish = true`)

页面变为一个完整的评论区，访客可以直接发表评论。仅保留顶部横幅。

```toml
[moment]
  online_publish = true

  [moment.online]
    comment_provider = "waline"        # 选择: waline / twikoo / artalk
    waline_server_url = "https://waline.molx.net"
    waline_emoji = ["https://cdn.jsdelivr.net/npm/@waline/emojis/weibo"]

    [moment.online.banner]
      show_background = true           # 是否显示背景图
      background_image = "img/bj.jpg"  # 背景图路径
      show_avatar = true               # 是否显示头像
      show_nickname = true             # 是否显示昵称
      show_signature = true            # 是否显示签名
```

此模式下：
- 页面只显示横幅 + 评论系统
- 不加载说说卡片数据
- 不需要 `data/moments.yaml`

#### 离线展示模式 (`online_publish = false`)

展示手动维护的说说卡片，类似微信朋友圈风格。

```toml
[moment]
  online_publish = false

  [moment.offline]
    comment_provider = ""              # 空=禁用每条说说的评论, 或选: waline / twikoo / artalk
    paginate = 10                      # 每次加载条数
    waline_server_url = ""

    [moment.offline.banner]
      show_background = true
      background_image = "img/bj.jpg"

    [moment.offline.profile]
      default_nickname = "知 止"       # 默认昵称
      default_avatar = "img/avatar.png" # 默认头像
      show_signature = true
      signature = "记录生活，分享感悟"
```

此模式下：
- 从 `data/moments.yaml` 读取说说数据
- 显示说说卡片列表（支持无限滚动）
- 无发布框、无点赞按钮
- 可选开启每条说说的评论功能

### 12.2 评论系统（文章页）

文章页支持 4 种评论系统，只需选择一种。

**Giscus（推荐，基于 GitHub Discussions）：**

1. 仓库必须是 public，且启用 Discussions 功能
2. 安装 [Giscus App](https://github.com/apps/giscus) 到仓库
3. 访问 [giscus.app](https://giscus.app) 生成配置
4. 填入 `params.toml`：

```toml
[comment.article]
  provider = "giscus"
  giscus_repo = "你的用户名/你的仓库"
  giscus_repo_id = "R_xxxxx"
  giscus_category = "Announcements"
  giscus_category_id = "DIC_xxxxx"
```

**Waline：**

```toml
[comment.article]
  provider = "waline"
  waline_server_url = "https://你的waline地址"
```

**Twikoo：**

```toml
[comment.article]
  provider = "twikoo"
  twikoo_env_id = "你的环境ID"
```

**Artalk：**

```toml
[comment.article]
  provider = "artalk"
  artalk_server = "https://你的artalk地址"
  artalk_site = "你的站点名"
```

### 12.3 网站统计

**百度统计：**

```toml
[analytics]
  enable_baidu = true
  baidu_site_id = "你的百度统计ID"
```

**Google Analytics：**

```toml
[analytics]
  enable_google = true
  google_ga_id = "G-XXXXXXXXXX"
```

---

## 13. 日常维护

### 13.1 写文章流程

```bash
# 1. 新建文章
hugo new zh/posts/文章名.md

# 2. 编辑内容（用任意编辑器）
# 3. 本地预览
hugo server -D

# 4. 确认无误后提交
git add .
git commit -m "新增文章：文章名"
git push
```

推送后部署平台会自动重新构建，通常 1-2 分钟后站点更新。

### 13.2 更新主题

如果主题以 Git submodule 方式管理：

```bash
cd themes/hugo-theme-molyun
git pull origin main
cd ../..
```

### 13.3 备份

定期备份以下目录：
- `content/` — 所有内容
- `config/` — 所有配置
- `static/` — 自定义静态资源
- `data/` — 数据文件

---

## 14. 常见问题

### Q: 构建报错 "theme not found"

确认 `config/_default/config.toml` 中 `theme = "hugo-theme-molyun"` 与 `themes/` 下的主题目录名一致。

### Q: 样式没有加载 / 页面显示异常

- 确认使用的是 **Hugo Extended** 版本（`hugo version` 查看）
- 清理缓存重新构建：`hugo --cleanDestinationDir`

### Q: 图片不显示

- 图片路径相对于 `static/` 目录，如 `static/img/logo.png` 在模板中写为 `/img/logo.png`
- 外部图片确保 URL 可访问

### Q: 评论不显示

- 检查评论系统 provider 是否正确配置
- 检查浏览器控制台是否有报错
- Giscus 需确认 GitHub Discussions 已启用且安装了 Giscus App

### Q: 时刻页不显示内容

- 在线模式：检查 `comment_provider` 和对应评论系统配置是否正确
- 离线模式：检查 `data/moments.yaml` 是否存在且格式正确

### Q: 中文 URL 乱码

确保 Markdown 文件保存为 **UTF-8 无 BOM** 编码。

### Q: 多语言切换不工作

- 确认 `content/zh/` 和 `content/en/` 下都有对应的页面
- 确认 `config.toml` 中 languages 配置正确

### Q: 部署后页面空白

- 检查 `baseURL` 是否与实际部署地址一致（包含末尾 `/`）
- 查看浏览器控制台错误信息

---

## 快速部署清单

- [ ] 安装 Hugo Extended
- [ ] 修改 `config/_default/config.toml` 中的 `baseURL`
- [ ] 修改 `config/_default/params.toml` 中的站点名称、作者、社交链接
- [ ] 配置文章页评论系统（可选）
- [ ] 配置时刻页模式（可选）
- [ ] 本地 `hugo server -D` 预览确认
- [ ] 推送代码到 GitHub
- [ ] 选择部署平台（Cloudflare Pages / GitHub Pages / Netlify / Vercel）
- [ ] 绑定自定义域名（可选）
- [ ] 开始写文章！
