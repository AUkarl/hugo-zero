---
title: "使用 Hugo 搭建个人站点"
date: 2026-09-01
draft: false
description: "从零开始使用 Hugo 搭建一个极简风格的个人静态站点"
categories:
  - "技术"
tags:
  - "Hugo"
  - "静态站点"
img: ""
toc: true
math: false
comments: true
---

## 为什么选择 Hugo

Hugo 是世界上最快的静态网站生成器之一。它使用 Go 语言编写，构建速度极快。

### 主要优势

- **速度快** — 数百个页面也能在毫秒内完成构建
- **模板灵活** — 使用 Go Templates，功能强大
- **部署简单** — 输出纯静态文件，可部署到任何平台

## 快速开始

```bash
# 安装 Hugo Extended
# Windows: winget install Hugo.Hugo.Extended
# macOS: brew install hugo

# 创建新站点
hugo new site my-site

# 启动开发服务器
hugo server -D
```

## 总结

Hugo 非常适合搭建个人博客、文档站点和作品集。配合优秀的主题，可以快速搭建出美观实用的站点。
