---
title: "主题功能一览"
date: 2026-04-05
draft: false
description: "MOL空间 Hugo 主题的完整功能列表，包含所有内置特性和可配置选项。"
categories:
  - "文档"
tags:
  - "主题"
  - "功能"
  - "特性"
image: "https://picsum.photos/seed/features/600/400"
author: "zhizhi"
toc: true
---

## 核心特性

### 响应式设计

完美适配桌面、平板和手机，所有页面均经过精心优化。

### 主题切换

支持亮色、暗色和跟随系统三种模式，用户偏好通过 localStorage 持久化。

### 多语言

完整的中英文双语支持，涵盖所有页面和交互文本。

### 极速加载

- 纯静态页面，无后端依赖
- CSS/JS 自动压缩 + 指纹缓存
- 图片懒加载
- 按需加载数学公式

## 页面模块

### 首页落地页
- 诗句轮播（可配置中英文各 6 条）
- 主题/语言切换按钮
- 键盘回车快速进入

### 文章系统
- 卡片式主页列表
- 文章详情页（目录、字数统计、阅读时间）
- 分类和标签系统
- 上下篇导航
- 作者信息框（数据驱动）
- CC BY-NC-SA 4.0 协议展示

### 时刻页
- 微信朋友圈风格
- 支持发布文字、图片、音乐、视频
- 点赞和评论功能
- 配置可控（发布/点赞/评论开关）

### 工具页
- 10 大分类工具集
- 数据驱动（`data/tools.yaml`）
- 点击子项展示模拟界面

### 归档页
- 按年份分组的时间线
- 标签弹幕（弹幕式标签云）
- 点击标签过滤文章

### 工坊页
- CSS Grid 项目卡片
- 状态标签（进行中/草稿/已完成）
- 数据驱动（`data/works.yaml` 或 `params.works`）

## 评论系统

支持 5 种评论系统：

| 系统 | 特点 |
|------|------|
| Waline | 功能丰富，支持表情和统计 |
| Giscus | 基于 GitHub Discussions |
| Twikoo | 轻量，支持多种部署 |
| Artalk | 自托管，功能完善 |
| Utterances | 基于 GitHub Issues |

## 短代码

| 短代码 | 用途 |
|--------|------|
| `audio-163` | 网易云音乐 |
| `audio-qq` | QQ 音乐 |
| `audio-kugou` | 酷狗音乐 |
| `video-bilibili` | Bilibili 视频 |
| `video-youtube` | YouTube 视频 |
| `video-tencent` | 腾讯视频 |
| `video-youku` | 优酷视频 |
| `katex` | 数学公式 |
| `code` | 带标题的代码块 |

## SEO

- Open Graph 元标签
- Twitter Card
- 结构化数据
- Sitemap 自动生成
- RSS 订阅

## 统计

- Google Analytics (GA4)
- 百度统计

## CMS

- Decap CMS 集成
- 可视化内容管理
- 数据文件编辑
