---
title: "用 Hugo 搭建个人站点的心路历程"
date: 2026-01-15
draft: false
description: "从零开始用 Hugo 搭建一个极简个人站点的完整记录，包含主题开发、部署和日常维护的经验分享。"
subtitle: "从零到一的极简之旅"
categories:
  - "技术"
tags:
  - "Hugo"
  - "静态站点"
  - "前端"
image: "https://picsum.photos/seed/hugo/600/400"
author: "zhizhi"
toc: true
math: false
comments: true
---

## 为什么选择 Hugo

在尝试了 WordPress、Hexo、Jekyll 之后，最终选择了 Hugo。原因很简单：

1. **速度快** — Go 编写的构建引擎，千篇文章也能秒级构建
2. **单文件部署** — 生成的纯静态文件，任何 Web 服务器都能托管
3. **灵活的模板系统** — Go 模板虽然学习曲线陡峭，但功能强大

## 主题开发要点

开发这个主题时，最核心的设计理念是**极简**：

```css
:root {
  --bg: #fafafa;
  --text: #333;
  --card-bg: #fff;
  --border: #e8e8e8;
}
```

通过 CSS 变量实现主题切换，配合 `localStorage` 持久化用户偏好。

## 数学公式支持

主题支持 LaTeX 公式，行内公式如 $E = mc^2$，以及独立公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## 总结

搭建个人站点的过程本身就是一次学习之旅。不追求完美，只追求表达。

{{< notice type="info" title="提示" >}}
如果你也想搭建自己的 Hugo 站点，建议从官方文档开始：[gohugo.io](https://gohugo.io)
{{< /notice >}}