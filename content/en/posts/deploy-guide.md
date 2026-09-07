---
title: "Deployment Guide"
date: 2026-03-10
draft: false
description: "Detailed steps for deploying your Hugo site to Cloudflare Pages, Vercel, Netlify, GitHub Pages, and more."
categories:
  - "Docs"
tags:
  - "Deployment"
  - "Cloudflare"
  - "Vercel"
  - "CI/CD"
image: "https://picsum.photos/seed/deploy/600/400"
author: "zhizhi"
toc: true
---

## Local Build

Verify the build locally before deploying:

```bash
hugo --gc --minify
```

The `public/` directory contains the build output, ready to upload to any web server.

## Cloudflare Pages

1. Push your code to GitHub/GitLab
2. Log in to Cloudflare Dashboard → Pages → Create project
3. Connect your repo, set build command:
   - **Build command**: `hugo --gc --minify`
   - **Build output directory**: `public`
4. Click deploy and wait for the URL

### Custom Domain

Add a custom domain in your Cloudflare Pages project settings and configure DNS records.

## Vercel

1. Log in to Vercel → New Project → Import repository
2. Set Framework Preset to `Hugo`
3. Add environment variable `HUGO_VERSION` (e.g., `0.165.0`)
4. Click Deploy

## Netlify

1. Log in to Netlify → New site from Git
2. Select repo, configure:
   - **Build command**: `hugo --gc --minify`
   - **Publish directory**: `public`
3. Add environment variable `HUGO_VERSION` = `0.165.0`

## GitHub Pages

Use GitHub Actions for automated deployment. Create `.github/workflows/deploy.yml`:

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

## Alibaba Cloud OSS

```bash
hugo --gc --minify
ossutil cp -r public/ oss://your-bucket/ --update
```

Pair with a CDN for faster access.
