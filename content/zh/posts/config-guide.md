---
title: "配置指南"
date: 2026-03-05
draft: false
description: "MOL空间主题的完整配置参考，涵盖站点信息、首页、文章、归档、评论、统计等所有模块。"
categories:
  - "文档"
tags:
  - "配置"
  - "params.toml"
  - "参考"
image: "https://picsum.photos/seed/config/600/400"
author: "zhizhi"
toc: true
---

## 配置文件结构

主题使用 Hugo 的多文件配置结构，所有配置文件位于 `config/_default/` 目录下：

```
config/_default/
├── config.toml      # 站点基础配置
├── params.toml      # 主题参数（18 个配置块）
├── menus.toml       # 导航菜单
└── taxonomies.toml  # 分类法定义
```

## 站点基本信息

```toml
site_name = "molyun"
logo = "/img/logo.png"
show_logo = true
default_author = "zhizhi"
enable_lang_switch = true
enable_theme_switch = true
description = "个人站点描述"
author = "molyun"
```

## 首页落地页

```toml
[landing]
  quotes_zh = ["海上生明月 & 天涯共此时", ...]
  quotes_en = ["The moon rises over the sea...", ...]
```

诗句支持中英文各 6 条，随机展示。

## 主页列表

```toml
[home]
  paginate = 20       # 每页文章数
  columns = 4         # 卡片列数
  show_images = true  # 是否显示封面图
  summary_length = 120
```

## 文章详情

```toml
[article]
  show_toc = true           # 显示目录
  toc_levels = ["h2", "h3"] # 目录层级
  show_word_count = true    # 字数统计
  show_author_box = true    # 作者信息框
  show_license = true       # 版权协议
  donate_max_qr = 6         # 赞赏码最大数量
```

## 评论系统

支持 5 种评论系统，文章和时刻页可独立配置：

```toml
[comment.article]
  provider = "waline"  # waline / giscus / twikoo / artalk / utterances

[comment.moment]
  provider = "twikoo"
```

各评论系统的具体配置项请参考 [评论系统配置]({{< relref "comment-system" >}})。

## 统计分析

```toml
[analytics]
  enable_google = false
  google_ga_id = ""
  enable_baidu = false
  baidu_site_id = ""
```

## 页脚

```toml
[footer]
  copyright_text = "2023-{year} Molyun"
  designer = "designed by 知止"
  icp = ""

  [[footer.services]]
    name = "Hugo"
    icon = "fa-brands fa-hugo"
    link = "https://gohugo.io/"

  [[footer.social_row1]]
    name = "GitHub"
    icon = "fa-brands fa-github"
    link = "https://github.com/..."
```

## 自定义扩展

```toml
[custom]
  head_html = ""       # 注入到 <head> 的自定义 HTML
  footer_html = ""     # 注入到 </body> 前的自定义 HTML
  extra_css = []       # 额外 CSS 文件路径
  extra_js = []        # 额外 JS 文件路径
```
