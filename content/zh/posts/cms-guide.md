---
title: "CMS 使用指南"
date: 2026-03-25
draft: false
description: "使用 Decap CMS（原 Netlify CMS）可视化管理 Hugo 站点内容的配置方法。"
categories:
  - "文档"
tags:
  - "CMS"
  - "Decap CMS"
  - "内容管理"
image: "https://picsum.photos/seed/cms/600/400"
author: "zhizhi"
toc: true
---

## 什么是 Decap CMS

Decap CMS（前身为 Netlify CMS）是一个开源的内容管理系统，通过 Git 工作流管理站点内容。无需数据库，所有数据存储在 Markdown 文件中。

## 启用 CMS

### 1. 创建管理页面

在 `static/admin/` 目录下创建两个文件：

```
static/admin/
├── index.html    # CMS 入口页面
└── config.yml    # CMS 配置文件
```

### 2. index.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>内容管理</title>
  <script src="https://unpkg.com/decap-cms" crossorigin="anonymous"></script>
</head>
<body></body>
</html>
```

### 3. config.yml

```yaml
backend:
  name: github
  repo: username/repo
  branch: main

media_folder: "static/img/uploads"
public_folder: "/img/uploads"

collections:
  - name: "posts_zh"
    label: "中文文章"
    folder: "content/zh/posts"
    create: true
    fields:
      - { label: "标题", name: "title", widget: "string" }
      - { label: "发布日期", name: "date", widget: "datetime" }
      - { label: "描述", name: "description", widget: "text" }
      - { label: "分类", name: "categories", widget: "list" }
      - { label: "标签", name: "tags", widget: "list" }
      - { label: "封面图", name: "image", widget: "image" }
      - { label: "正文", name: "body", widget: "markdown" }
```

## 数据文件集合

CMS 也可以管理 `data/` 目录下的 YAML 数据文件：

```yaml
collections:
  - name: "moments"
    label: "时刻"
    folder: "content/zh/moments"
    create: true
    fields:
      - { label: "内容", name: "body", widget: "text" }
      - { label: "图片", name: "images", widget: "list", field: { label: "URL", name: "url", widget: "image" } }
      - { label: "日期", name: "date", widget: "datetime" }
```

## 本地预览

```bash
npx decap-cms-proxy-server
```

然后访问 `http://localhost:8080/admin/` 即可在本地使用 CMS。

## 注意事项

- CMS 仅管理内容，不管理主题和配置
- 所有修改通过 Git 提交，保留完整历史
- 建议设置分支策略，通过 PR 审核内容变更
