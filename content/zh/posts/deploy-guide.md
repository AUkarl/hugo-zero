---
title: "部署指南"
date: 2026-03-10
draft: false
description: "将 Hugo 站点部署到 Cloudflare Pages、Vercel、Netlify、GitHub Pages 等平台的详细步骤。"
categories:
  - "文档"
tags:
  - "部署"
  - "Cloudflare"
  - "Vercel"
  - "CI/CD"
image: "https://picsum.photos/seed/deploy/600/400"
author: "zhizhi"
toc: true
---

## 本地构建

部署前先在本地验证构建：

```bash
hugo --gc --minify
```

`public/` 目录即为构建产物，可上传到任何 Web 服务器。

## Cloudflare Pages

1. 将代码推送到 GitHub/GitLab
2. 登录 Cloudflare Dashboard → Pages → 创建项目
3. 连接仓库，设置构建命令：
   - **Build command**: `hugo --gc --minify`
   - **Build output directory**: `public`
4. 点击部署，等待完成后即可获得 URL

### 自定义域名

在 Cloudflare Pages 项目设置中添加自定义域名，按提示配置 DNS 记录。

## Vercel

1. 登录 Vercel → New Project → 导入仓库
2. Framework Preset 选择 `Hugo`
3. 环境变量添加 `HUGO_VERSION`（如 `0.165.0`）
4. 点击 Deploy

## Netlify

1. 登录 Netlify → New site from Git
2. 选择仓库，设置：
   - **Build command**: `hugo --gc --minify`
   - **Publish directory**: `public`
3. 添加环境变量 `HUGO_VERSION` = `0.165.0`

## GitHub Pages

使用 GitHub Actions 自动部署，创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Hugo site to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      - uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.165.0'
          extended: true
      - run: hugo --gc --minify
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

## 阿里云 OSS

```bash
hugo --gc --minify
ossutil cp -r public/ oss://your-bucket/ --update
```

建议配合 CDN 使用，设置缓存策略以提升访问速度。
