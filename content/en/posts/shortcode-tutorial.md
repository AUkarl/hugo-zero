---
title: "Shortcode Tutorial"
date: 2026-03-15
draft: false
description: "Complete guide to built-in shortcodes in the MOL Space theme, covering audio/video embeds, code highlighting, and math formulas."
categories:
  - "Docs"
tags:
  - "Shortcodes"
  - "Tutorial"
image: "https://picsum.photos/seed/shortcode/600/400"
author: "zhizhi"
toc: true
---

## What Are Shortcodes

Shortcodes are Hugo template snippets that let you embed complex content in Markdown articles. Use the `{{</* shortcode */>}}` syntax.

## Audio Embeds

### NetEase Music

```
{{</* audio-163 id="1234567890" */>}}
```

### QQ Music

```
{{</* audio-qq id="003ZPMGY3SiLbZ" */>}}
```

### Kugou Music

```
{{</* audio-kugou id="12345" */>}}
```

## Video Embeds

### Bilibili

```
{{</* video-bilibili bvid="BV1xx411c7mD" */>}}
```

Supports responsive 16:9 aspect ratio.

### YouTube

```
{{</* video-youtube id="dQw4w9WgXcQ" */>}}
```

### Tencent Video

```
{{</* video-tencent id="v1234abcd" */>}}
```

### Youku Video

```
{{</* video-youku id="XNTE12345" */>}}
```

## Code Blocks

Use the `code` shortcode to add a title bar:

```
{{</* code language="python" title="hello.py" */>}}
def hello():
    print("Hello, World!")
{{</* /code */>}}
```

## Math Formulas

Use the `katex` shortcode for math:

```
{{</* katex */>}}
E = mc^2
{{</* /katex */>}}
```

Or set `math: true` in front matter for global support.

## Built-in Shortcodes

Hugo's built-in shortcodes are also available:

- `{{</* figure */>}}` — Image with caption
- `{{</* gist */>}}` — GitHub Gist
- `{{</* tweet */>}}` — Embedded tweet
- `{{</* youtube */>}}` — YouTube video
