---
# ============================================================
# archetypes/posts.md — 文章 archetype 模板
# 使用 hugo new --kind posts content/posts/my-post.md 创建
# 包含完整 front matter 字段
# ============================================================
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
lastmod: {{ .Date }}
draft: true
description: ""
subtitle: ""
categories:
  - "未分类"
tags:
  - "未标签"
img: ""
toc: true
math: false
comments: true
---

## 引言

在这里开始写作...

## 正文

### 第一部分

### 第二部分

## 总结
