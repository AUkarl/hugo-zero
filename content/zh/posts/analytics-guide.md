---
title: "统计分析指南"
date: 2026-03-28
draft: false
description: "为站点配置 Google Analytics 和百度统计，追踪访客数据和页面访问情况。"
categories:
  - "文档"
tags:
  - "统计"
  - "Google Analytics"
  - "百度统计"
image: "https://picsum.photos/seed/analytics/600/400"
author: "zhizhi"
toc: true
---

## 概述

主题内置了 Google Analytics 和百度统计的支持，可以在 `params.toml` 中一键启用。

## Google Analytics

### 获取跟踪 ID

1. 登录 [Google Analytics](https://analytics.google.com)
2. 创建媒体资源，获取 Measurement ID（格式：`G-XXXXXXXXXX`）

### 配置

```toml
[analytics]
  enable_google = true
  google_ga_id = "G-XXXXXXXXXX"
```

启用后，主题会自动在每个页面加载 GA4 跟踪代码。

## 百度统计

### 获取跟踪代码

1. 登录 [百度统计](https://tongji.baidu.com)
2. 添加网站，获取跟踪代码中的站点 ID

### 配置

```toml
[analytics]
  enable_baidu = true
  baidu_site_id = "your-site-id"
```

## 同时使用

两个统计服务可以同时启用：

```toml
[analytics]
  enable_google = true
  google_ga_id = "G-XXXXXXXXXX"
  enable_baidu = true
  baidu_site_id = "your-site-id"
```

## 隐私考虑

- 统计代码仅在配置启用后加载
- 建议在隐私政策中说明使用的统计服务
- 可配合 Cookie 同意弹窗使用
