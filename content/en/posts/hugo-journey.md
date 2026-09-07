---
title: "Building a Personal Site with Hugo: A Journey"
date: 2026-01-15
draft: false
description: "A complete record of building a minimalist personal site from scratch with Hugo, including theme development, deployment, and maintenance."
subtitle: "A Minimalist Journey from Zero to One"
categories:
  - "Tech"
tags:
  - "Hugo"
  - "Static Site"
  - "Frontend"
image: "https://picsum.photos/seed/hugo/600/400"
author: "zhizhi"
toc: true
math: false
comments: true
---

## Why Hugo

After trying WordPress, Hexo, and Jekyll, I chose Hugo. The reasons are simple:

1. **Fast** — Go-powered build engine, thousands of articles built in seconds
2. **Single-file deployment** — Pure static files, hostable on any web server
3. **Flexible template system** — Go templates have a steep learning curve but are powerful

## Theme Development Highlights

The core design philosophy when developing this theme was **minimalism**:

```css
:root {
  --bg: #fafafa;
  --text: #333;
  --card-bg: #fff;
  --border: #e8e8e8;
}
```

Theme switching via CSS variables, with `localStorage` persisting user preferences.

## Math Formula Support

The theme supports LaTeX formulas — inline like $E = mc^2$, and display:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Summary

Building a personal site is itself a learning journey. Not pursuing perfection, just expression.
