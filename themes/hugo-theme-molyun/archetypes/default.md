---
# ============================================================
# archetypes/default.md — 默认文章模板
# 使用 hugo new content/posts/my-post.md 创建新文章时自动填充
# ============================================================
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
description: ""
categories:
  - "未分类"
tags:
  - "未标签"
img: ""
---

在这里开始写作...
