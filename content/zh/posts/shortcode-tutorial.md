---
title: "短代码使用教程"
date: 2026-03-15
draft: false
description: "MOL空间主题内置短代码的完整使用指南，涵盖音视频嵌入、代码高亮、数学公式等。"
categories:
  - "文档"
tags:
  - "短代码"
  - "shortcode"
  - "教程"
image: "https://picsum.photos/seed/shortcode/600/400"
author: "zhizhi"
toc: true
---

## 什么是短代码

短代码（Shortcode）是 Hugo 提供的模板片段，可以在 Markdown 文章中嵌入复杂内容。使用 `{{</* shortcode */>}}` 语法调用。

## 音频嵌入

### 网易云音乐

```
{{</* audio-163 id="1234567890" */>}}
```

### QQ 音乐

```
{{</* audio-qq id="003ZPMGY3SiLbZ" */>}}
```

### 酷狗音乐

```
{{</* audio-kugou id="12345" */>}}
```

## 视频嵌入

### Bilibili

```
{{</* video-bilibili bvid="BV1xx411c7mD" */>}}
```

支持自动 16:9 比例响应式布局。

### YouTube

```
{{</* video-youtube id="dQw4w9WgXcQ" */>}}
```

### 腾讯视频

```
{{</* video-tencent id="v1234abcd */>}}
```

### 优酷视频

```
{{</* video-youku id="XNTE12345 */>}}
```

## 代码块

使用 `code` 短代码可以添加标题栏：

```
{{</* code language="python" title="hello.py" */>}}
def hello():
    print("Hello, World!")
{{</* /code */>}}
```

## 数学公式

使用 `katex` 短代码在文章中插入数学公式：

```
{{</* katex */>}}
E = mc^2
{{</* /katex */>}}
```

也可以在 Front matter 中设置 `math: true` 启用全局支持。

## 内置短代码

Hugo 自带的短代码同样可用：

- `{{</* figure */>}}` — 图片 + 标题
- `{{</* gist */>}}` — GitHub Gist
- `{{</* tweet */>}}` — 嵌入推文
- `{{</* youtube */>}}` — YouTube 视频
