---
title: "Configuration Guide"
date: 2026-03-05
draft: false
description: "Complete configuration reference for the MOL Space theme, covering site info, home, articles, archive, comments, analytics, and more."
categories:
  - "Docs"
tags:
  - "Configuration"
  - "params.toml"
  - "Reference"
image: "https://picsum.photos/seed/config/600/400"
author: "zhizhi"
toc: true
---

## Config File Structure

The theme uses Hugo's multi-file config structure. All config files are in `config/_default/`:

```
config/_default/
├── config.toml      # Site basics
├── params.toml      # Theme parameters (18 blocks)
├── menus.toml       # Navigation menu
└── taxonomies.toml  # Taxonomy definitions
```

## Site Information

```toml
site_name = "molyun"
logo = "/img/logo.png"
show_logo = true
default_author = "zhizhi"
enable_lang_switch = true
enable_theme_switch = true
description = "Site description"
author = "molyun"
```

## Landing Page

```toml
[landing]
  quotes_zh = ["海上生明月 & 天涯共此时", ...]
  quotes_en = ["The moon rises over the sea...", ...]
```

Supports 6 quotes each for Chinese and English.

## Home List

```toml
[home]
  paginate = 20       # Posts per page
  columns = 4         # Card columns
  show_images = true  # Show cover images
  summary_length = 120
```

## Article Details

```toml
[article]
  show_toc = true
  toc_levels = ["h2", "h3"]
  show_word_count = true
  show_author_box = true
  show_license = true
  donate_max_qr = 6
```

## Comment System

Supports 5 providers, independently configurable for articles and moments:

```toml
[comment.article]
  provider = "waline"

[comment.moment]
  provider = "twikoo"
```

See [Comment System Config]({{< relref "comment-system" >}}) for provider-specific settings.

## Analytics

```toml
[analytics]
  enable_google = false
  google_ga_id = ""
  enable_baidu = false
  baidu_site_id = ""
```

## Footer

```toml
[footer]
  copyright_text = "2023-{year} Molyun"
  designer = "designed by Zhizhi"
  icp = ""

  [[footer.services]]
    name = "Hugo"
    icon = "fa-brands fa-hugo"
    link = "https://gohugo.io/"

  [[footer.social_row1]]
    name = "GitHub"
    icon = "fa-brands fa-github"
    link = "https://github.com/..."
```

## Custom Extensions

```toml
[custom]
  head_html = ""       # Custom HTML in <head>
  footer_html = ""     # Custom HTML before </body>
  extra_css = []       # Additional CSS paths
  extra_js = []        # Additional JS paths
```
