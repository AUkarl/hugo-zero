---
title: "Analytics Guide"
date: 2026-03-28
draft: false
description: "Configure Google Analytics and Baidu Analytics to track visitor data and page views."
categories:
  - "Docs"
tags:
  - "Analytics"
  - "Google Analytics"
  - "Baidu Analytics"
image: "https://picsum.photos/seed/analytics/600/400"
author: "zhizhi"
toc: true
---

## Overview

The theme has built-in support for Google Analytics and Baidu Analytics, configurable in `params.toml`.

## Google Analytics

### Get Tracking ID

1. Log in to [Google Analytics](https://analytics.google.com)
2. Create a property and get your Measurement ID (format: `G-XXXXXXXXXX`)

### Config

```toml
[analytics]
  enable_google = true
  google_ga_id = "G-XXXXXXXXXX"
```

Once enabled, the theme automatically loads GA4 tracking on every page.

## Baidu Analytics

### Get Tracking Code

1. Log in to [Baidu Analytics](https://tongji.baidu.com)
2. Add your site and get the site ID from the tracking code

### Config

```toml
[analytics]
  enable_baidu = true
  baidu_site_id = "your-site-id"
```

## Using Both

Both services can be enabled simultaneously:

```toml
[analytics]
  enable_google = true
  google_ga_id = "G-XXXXXXXXXX"
  enable_baidu = true
  baidu_site_id = "your-site-id"
```

## Privacy Considerations

- Analytics scripts only load when configured and enabled
- Mention the analytics services in your privacy policy
- Consider pairing with a cookie consent banner
