# Zero

一个极简风格的 Hugo 个人站点主题。

## 特性

- 极简设计，响应式布局
- 中英双语支持（客户端无刷新切换）
- 暗色/亮色模式自动切换
- 时刻页双模式（在线评论 / 离线展示）
- 弹幕标签云归档
- 数学公式支持（KaTeX）
- 多种评论系统（Waline / Twikoo / Artalk / Giscus）
- SEO 友好
- 文章字数统计与阅读时间估算
- 文章赞赏功能
- 隐私政策页
- 宝贝回家公益插件
- 自定义页脚链接与社交图标

## 安装

### 作为 Git 子模块

```bash
cd your-site
git submodule add https://github.com/AUkarl/hugo-zero.git themes/zero
```

### 手动安装

下载主题压缩包，解压到 `themes/zero` 目录。

## 快速开始

1. 在站点根目录的 `hugo.toml` 中设置主题：

```toml
theme = "zero"
```

2. 复制示例配置和静态资源：

```bash
cp -r themes/zero/exampleSite/config/* config/
cp -r themes/zero/exampleSite/static/* static/
cp -r themes/zero/exampleSite/content/* content/
```

3. 根据需要修改 `config/_default/params.toml` 中的配置项。

4. 启动本地预览：

```bash
hugo server -D
```

## 配置说明

主题通过 `config/_default/params.toml` 进行配置，参考 `themes/zero/exampleSite/config/_default/params.toml` 获取完整示例。

### 主要配置区域

| 配置块 | 说明 |
|--------|------|
| 全局设置 | 站点名称、作者、Logo、Favicon |
| `nav` | 导航栏链接 |
| `index` | 首页轮播诗句 |
| `home` | 文章列表页配置 |
| `moment` | 时刻页（在线/离线模式） |
| `comments` | 评论系统配置 |
| `footer` | 页脚链接与社交图标 |
| `about` | 关于页内容 |
| `author_profile` | 文章作者信息框 |

### 评论系统

支持四种评论系统，在 `params.toml` 的 `[comments]` 区域配置：

- **Waline** — 功能最全，需要后端部署
- **Twikoo** — 轻量级，支持多种部署方式
- **Artalk** — 自托管，功能丰富
- **Giscus** — 基于 GitHub Discussions，零部署

### 时刻页模式

- **在线模式** — 通过评论系统（Waline）实现动态说说
- **离线模式** — 通过 Hugo 内容文件手动管理说说

## 目录结构

```
themes/zero/
├── archetypes/     # 内容模板
├── assets/         # CSS / JS 源文件
├── config/         # 主题配置参考
├── exampleSite/    # 示例站点
├── i18n/           # 多语言翻译
├── layouts/        # 页面模板
├── static/         # 静态资源
├── LICENSE
├── README.md
└── theme.toml
```

## 要求

- Hugo >= 0.100.0
- 需要 Hugo extended 版本（用于 Sass 处理）

## 许可证

[MIT License](LICENSE)

## 作者

知止（Hardy）
