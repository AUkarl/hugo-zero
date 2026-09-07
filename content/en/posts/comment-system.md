---
title: "Comment System Configuration"
date: 2026-03-20
draft: false
description: "Detailed setup for five comment systems: Waline, Giscus, Twikoo, Artalk, and Utterances."
categories:
  - "Docs"
tags:
  - "Comments"
  - "Waline"
  - "Giscus"
  - "Twikoo"
image: "https://picsum.photos/seed/comments/600/400"
author: "zhizhi"
toc: true
---

## Overview

The theme supports 5 comment systems. Article pages and moment pages can use different providers independently.

Configure in `config/_default/params.toml`:

```toml
[comment.article]
  provider = "waline"

[comment.moment]
  provider = "twikoo"
```

## Waline

A feature-rich comment system with emoji, pageview stats, and sorting.

### Setup

See the [Waline docs](https://waline.js.org/guide/get-started/) for server deployment.

### Config

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

Based on GitHub Discussions, great for tech blogs.

### Prerequisites

1. Repo must be public
2. Install the [Giscus App](https://github.com/apps/giscus)
3. Get your config at [giscus.app](https://giscus.app)

### Config

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

Lightweight comment system with multiple deployment options.

```toml
[comment.article]
  provider = "twikoo"
  twikoo_env_id = "your-env-id"
  twikoo_region = "ap-shanghai"
```

## Artalk

Self-hosted comment system with comprehensive features.

```toml
[comment.article]
  provider = "artalk"
  artalk_server = "https://your-artalk-server.com"
  artalk_site = "MOL Space"
```

## Utterances

Based on GitHub Issues, simple and lightweight.

```toml
[comment.article]
  provider = "utterances"
  utterances_repo = "username/repo"
  utterances_issue_term = "pathname"
  utterances_label = "comment"
```

## Disable Comments

In a single post's front matter:

```yaml
comments: false
```
