---
title: "评论系统配置"
date: 2026-03-20
draft: false
description: "五种评论系统（Waline、Giscus、Twikoo、Artalk、Utterances）的详细配置方法。"
categories:
  - "文档"
tags:
  - "评论"
  - "Waline"
  - "Giscus"
  - "Twikoo"
image: "https://picsum.photos/seed/comments/600/400"
author: "zhizhi"
toc: true
---

## 概述

主题支持 5 种评论系统，文章页和时刻页可以独立配置不同的评论系统。

在 `config/_default/params.toml` 中配置：

```toml
[comment.article]
  provider = "waline"   # 文章页评论

[comment.moment]
  provider = "twikoo"   # 时刻页评论
```

## Waline

Waline 是一款功能丰富的评论系统，支持表情、访问量统计、评论排序等。

### 部署

参考 [Waline 官方文档](https://waline.js.org/guide/get-started/) 部署服务端。

### 配置

```toml
[comment.article]
  provider = "waline"
  waline_server_url = "https://your-waline.vercel.app"
  waline_emoji = ["https://cdn.jsdelivr.net/npm/@waline/emojis/weibo"]
  waline_visitor = true
  waline_comment_sorting = "latest"
  waline_pageview = true
```

## Giscus

基于 GitHub Discussions 的评论系统，适合技术博客。

### 前置条件

1. 仓库必须为公开
2. 安装 [Giscus App](https://github.com/apps/giscus)
3. 在 [giscus.app](https://giscus.app) 获取配置

### 配置

```toml
[comment.article]
  provider = "giscus"
  giscus_repo = "username/repo"
  giscus_repo_id = "R_xxx"
  giscus_category = "Announcements"
  giscus_category_id = "DIC_xxx"
  giscus_mapping = "pathname"
  giscus_label = "comment"
```

## Twikoo

轻量级评论系统，支持多种部署方式。

```toml
[comment.article]
  provider = "twikoo"
  twikoo_env_id = "your-env-id"
  twikoo_region = "ap-shanghai"
```

## Artalk

自托管评论系统，功能完善。

```toml
[comment.article]
  provider = "artalk"
  artalk_server = "https://your-artalk-server.com"
  artalk_site = "MOL空间"
```

## Utterances

基于 GitHub Issues 的评论系统，简洁轻量。

```toml
[comment.article]
  provider = "utterances"
  utterances_repo = "username/repo"
  utterances_issue_term = "pathname"
  utterances_label = "comment"
```

## 禁用评论

在单篇文章的 Front matter 中设置：

```yaml
comments: false
```
