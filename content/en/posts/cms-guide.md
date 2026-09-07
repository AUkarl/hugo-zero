---
title: "CMS Guide"
date: 2026-03-25
draft: false
description: "How to use Decap CMS (formerly Netlify CMS) to visually manage Hugo site content."
categories:
  - "Docs"
tags:
  - "CMS"
  - "Decap CMS"
  - "Content Management"
image: "https://picsum.photos/seed/cms/600/400"
author: "zhizhi"
toc: true
---

## What Is Decap CMS

Decap CMS (formerly Netlify CMS) is an open-source content management system that manages site content through a Git workflow. No database needed — all data is stored in Markdown files.

## Enable CMS

### 1. Create Admin Pages

Create two files in `static/admin/`:

```
static/admin/
├── index.html    # CMS entry page
└── config.yml    # CMS configuration
```

### 2. index.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
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
  - name: "posts_en"
    label: "English Posts"
    folder: "content/en/posts"
    create: true
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime" }
      - { label: "Description", name: "description", widget: "text" }
      - { label: "Categories", name: "categories", widget: "list" }
      - { label: "Tags", name: "tags", widget: "list" }
      - { label: "Cover Image", name: "image", widget: "image" }
      - { label: "Body", name: "body", widget: "markdown" }
```

## Data File Collections

CMS can also manage YAML data files in the `data/` directory:

```yaml
collections:
  - name: "moments"
    label: "Moments"
    folder: "content/en/moments"
    create: true
    fields:
      - { label: "Content", name: "body", widget: "text" }
      - { label: "Images", name: "images", widget: "list", field: { label: "URL", name: "url", widget: "image" } }
      - { label: "Date", name: "date", widget: "datetime" }
```

## Local Preview

```bash
npx decap-cms-proxy-server
```

Then visit `http://localhost:8080/admin/` to use the CMS locally.

## Notes

- CMS manages content only, not themes or configuration
- All changes are committed via Git with full history
- Consider a branch strategy with PR reviews for content changes
