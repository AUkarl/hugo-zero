---
title: "快速开始"
date: 2026-03-01
draft: false
description: "从零开始搭建 MOL空间站点的快速指南，包含环境准备、安装和基础配置。"
categories:
  - "文档"
tags:
  - "快速开始"
  - "教程"
  - "Hugo"
image: "https://picsum.photos/seed/quickstart/600/400"
author: "zhizhi"
toc: true
---

## 环境准备

在开始之前，请确保你的开发环境满足以下要求：

- **Hugo** v0.120.0 或更高版本（推荐 extended 版）
- **Git** 用于版本控制
- 一个你喜欢的文本编辑器

## 安装 Hugo

### macOS

```bash
brew install hugo
```

### Windows

```bash
winget install Hugo.Hugo.Extended
```

### Linux

参考 [Hugo 官方安装指南](https://gohugo.io/installation/)。

## 创建站点

```bash
hugo new site my-site
cd my-site
```

## 安装主题

将主题放入 `themes/` 目录：

```bash
git clone https://github.com/your-repo/hugo-theme-molyun themes/hugo-theme-molyun
```

在配置文件中指定主题：

```toml
theme = "hugo-theme-molyun"
```

## 基础配置

编辑 `config/_default/config.toml`：

```toml
baseURL = "https://your-site.com/"
title = "我的站点"
theme = "hugo-theme-molyun"
languageCode = "zh-CN"
defaultContentLanguage = "zh"
```

## 创建第一篇文章

```bash
hugo new posts/my-first-post.md
```

编辑生成的文件，写入你的内容，然后：

```bash
hugo server
```

打开浏览器访问 `http://localhost:1313` 即可预览。

## 下一步

- 阅读 [配置指南]({{< relref "config-guide" >}}) 了解所有配置选项
- 阅读 [部署指南]({{< relref "deploy-guide" >}}) 将站点发布到互联网
