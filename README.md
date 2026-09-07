# hugo-theme-molyun

一个极简风格的 [Hugo](https://gohugo.io/) 个人站点主题，支持中英双语、暗色模式、时刻页双模式、弹幕标签云归档等功能。

A minimalist Hugo theme with bilingual support, dark mode, dual-mode moments page, and danmaku tag cloud archive.

站点示例：[molyun.com](https://molyun.com/)

---

## 功能特性

- **落地页** — 诗词轮播 + 欢迎语，可配置背景图
- **主页** — 文章卡片列表，分页浏览
- **文章页** — Markdown 渲染、目录导航、字数统计、阅读时间、作者信息
- **归档页** — 按年份时间线展示所有文章，支持搜索和分类/标签筛选
- **时刻页** — 两种模式：
  - **在线发布模式**：完整评论区（Waline / Twikoo / Artalk），访客直接互动
  - **离线展示模式**：展示 `data/moments.yaml` 中的时刻卡片，微信朋友圈风格
- **关于页** — 个人介绍、社交链接、友情链接
- **工坊页** — 项目展示
- **工具页** — 实用工具集合
- **邮件页** — 登录入口
- **多语言** — 中文/英文双语支持，客户端动态切换
- **暗色模式** — 一键切换明暗主题
- **评论系统** — 文章页支持 Giscus / Waline / Twikoo / Artalk
- **响应式设计** — 适配桌面和移动端
- **SEO 优化** — Sitemap、Open Graph、结构化数据
- **数学公式** — KaTeX 按需加载
- **统计分析** — Google Analytics / 百度统计

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 静态生成器 | Hugo Extended >= 0.100.0 |
| 模板引擎 | Go Templates |
| 样式 | 原生 CSS（CSS Variables） |
| 脚本 | 原生 JavaScript（无框架依赖） |
| 评论 | Giscus / Waline / Twikoo / Artalk |
| 部署 | Cloudflare Pages / GitHub Pages / Netlify / Vercel |

---

## 快速开始

### 环境要求

- Hugo Extended >= 0.100.0（必须）
- Git

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/AUkarl/hugo-home.git
cd hugo-home

# 本地预览
hugo server -D

# 浏览器打开 http://localhost:1313
```

### 首次配置

编辑 `config/_default/` 下的三个文件：

1. **config.toml** — 设置 `baseURL` 为你的域名
2. **params.toml** — 修改站点名称、作者、社交链接、评论系统等
3. **menus.toml** — 调整导航菜单

> 主题自带示例站点：`themes/hugo-theme-molyun/exampleSite/` 包含完整配置示例，可参考其中的参数设置。

> 项目已配置 `.gitignore`，构建产物（`public/`、`resources/`）不会被 Git 跟踪。

---

## 项目结构

```
hugo-home/
├── config/_default/          # 站点配置
│   ├── config.toml           #   基础配置
│   ├── menus.toml            #   导航菜单
│   └── params.toml           #   主题参数（全部可配置项）
├── content/                  # 内容文件
│   ├── zh/                   #   中文内容
│   └── en/                   #   英文内容
├── data/                     # 数据文件
│   ├── authors.yaml          #   作者信息
│   ├── moments.yaml          #   时刻数据（离线模式）
│   ├── tools.yaml            #   工具数据
│   └── works.yaml            #   工坊数据
├── static/                   # 静态资源
│   └── img/                  #   图片
└── themes/
    └── hugo-theme-molyun/    # 主题
        ├── layouts/          #   模板
        ├── assets/           #   CSS/JS
        ├── i18n/             #   翻译
        └── archetypes/       #   内容模板
```

---

## 页面说明

| 页面 | 路径 | 数据来源 |
|------|------|----------|
| 落地页 | `/` | 内联模板 |
| 主页 | `/home/` | `content/zh/posts/` |
| 归档 | `/archive/` | Hugo 自动聚合 |
| 时刻 | `/moments/` | `data/moments.yaml` 或评论系统 |
| 关于 | `/about/` | `content/zh/about/` |
| 工坊 | `/work/` | `data/works.yaml` |
| 工具 | `/tools/` | `data/tools.yaml` |
| 邮件 | `/email/` | 模板配置 |

---

## 时刻页配置

时刻页是本站的核心特色功能，支持两种模式：

### 在线发布模式

```toml
[moment]
  online_publish = true
  [moment.online]
    comment_provider = "waline"
    waline_server_url = "https://waline.molx.net"
```

页面直接使用第三方评论系统，你和访客可以直接交流。

### 离线展示模式

```toml
[moment]
  online_publish = false
  [moment.offline]
    paginate = 10
    [moment.offline.profile]
      default_nickname = "知止"
      default_avatar = "img/avatar.png"
```

从 `data/moments.yaml` 读取数据，展示说说卡片列表。

详细配置见 [DEPLOYMENT.md](DEPLOYMENT.md#121-时刻页两种模式)。

---

## 评论系统

### 文章页

支持 Giscus、Waline、Twikoo、Artalk（这个系统未测试，不保证可用）。在 `params.toml` 中选择一种：

```toml
[comment.article]
  provider = "giscus"
  giscus_repo = "用户名/仓库"
  giscus_repo_id = "R_xxx"
  giscus_category = "Announcements"
  giscus_category_id = "DIC_xxx"
```

### 时刻页

在线模式支持 Waline / Twikoo / Artalk（这个系统未测试，不保证可用）（通过 `[moment.online]` 配置）。
离线模式可选开启每条说说的评论（通过 `[moment.offline]` 配置）。

---

## 部署

支持多种部署方式：

- **Cloudflare Pages**（推荐）— 免费、快速、全球 CDN
- **GitHub Pages** — 免费，适合开源项目
- **Netlify** — 免费，支持表单提交
- **Vercel** — 免费，自动 HTTPS

详细步骤见 [DEPLOYMENT.md](DEPLOYMENT.md)。

---

## 主题定制

### 样式

主题使用 CSS Variables，可在 `static/css/custom.css` 中覆盖：

```css
:root {
  --text: #333;
  --bg: #fff;
  --card-bg: #fafafa;
  --border: #e0e0e0;
  --accent: #6c5ce7;
}
```

### 模板

所有模板在 `themes/hugo-theme-molyun/layouts/` 下，可按需覆盖。

### i18n

翻译文件在 `themes/hugo-theme-molyun/i18n/`，支持添加新语言。

---

## 开发

```bash
# 本地开发（监听文件变化）
hugo server -D

# 构建生产版本
hugo

# 清理后构建
hugo --cleanDestinationDir
```

---

## 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

## 致谢

- [Hugo](https://gohugo.io/) — 世界最快的静态网站生成器
- [Giscus](https://giscus.app/) — 基于 GitHub Discussions 的评论系统
- [Waline](https://waline.js.org/) — 简洁、安全的评论系统
- [Twikoo](https://twikoo.js.org/) — 简洁、安全、免费的评论系统
- [Artalk](https://artalk.js.org/) — 自托管评论系统

---

## 联系方式

- GitHub: [@AUkarl](https://github.com/AUkarl)
- 站点: [molyun.com](https://molyun.com/)
