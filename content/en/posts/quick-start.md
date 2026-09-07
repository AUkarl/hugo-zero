---
title: "Quick Start"
date: 2026-03-01
draft: false
description: "A quick guide to setting up a MOL Space site, including environment setup, installation, and basic configuration."
categories:
  - "Docs"
tags:
  - "Quick Start"
  - "Tutorial"
  - "Hugo"
image: "https://picsum.photos/seed/quickstart/600/400"
author: "zhizhi"
toc: true
---

## Prerequisites

Before getting started, make sure your environment meets these requirements:

- **Hugo** v0.120.0 or later (extended version recommended)
- **Git** for version control
- A text editor of your choice

## Install Hugo

### macOS

```bash
brew install hugo
```

### Windows

```bash
winget install Hugo.Hugo.Extended
```

### Linux

See the [official Hugo installation guide](https://gohugo.io/installation/).

## Create a Site

```bash
hugo new site my-site
cd my-site
```

## Install the Theme

Place the theme in the `themes/` directory:

```bash
git clone https://github.com/your-repo/hugo-theme-molyun themes/hugo-theme-molyun
```

Specify the theme in your config:

```toml
theme = "hugo-theme-molyun"
```

## Basic Configuration

Edit `config/_default/config.toml`:

```toml
baseURL = "https://your-site.com/"
title = "My Site"
theme = "hugo-theme-molyun"
languageCode = "en"
defaultContentLanguage = "en"
```

## Create Your First Post

```bash
hugo new posts/my-first-post.md
```

Edit the generated file, write your content, then:

```bash
hugo server
```

Open your browser at `http://localhost:1313` to preview.

## Next Steps

- Read the [Configuration Guide]({{< relref "config-guide" >}}) for all config options
- Read the [Deployment Guide]({{< relref "deploy-guide" >}}) to publish your site
