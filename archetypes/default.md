---
# ============================================================
# archetypes/default.md — 默认文章模板
# 使用 hugo new content/posts/my-post.md 创建新文章时自动填充
# ============================================================
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: false
description: "摘要"
categories:
  - "未分类"
tags:
  - "未标签"
image: ""
author: "你的名字"
toc: true
math: false
---

---

## 一、标题层级

## 二级标题（H2）

### 三级标题（H3）

#### 四级标题（H4）

##### 五级标题（H5）

###### 六级标题（H6）

---

## 二、文本格式

这是一段普通文字。其中包含 **加粗文字**、*斜体文字*、***加粗斜体***、~~删除线~~、`行内代码`、以及[超链接](https://molyun.com)。

> 这是一段引用文字。好的设计是隐形的，好的文字是真诚的。
>
> — 知止

---

## 三、列表

### 无序列表

- 第一项
- 第二项
  - 嵌套子项 A
  - 嵌套子项 B
- 第三项

### 有序列表

1. 安装 Hugo Extended
2. 克隆仓库
3. 运行 `hugo server -D`

### 任务列表

- [x] 完成主题设计
- [x] 支持暗色模式
- [ ] 添加更多 shortcode

---

## 四、表格

| 功能 | 状态 | 说明 |
|------|:----:|------|
| 暗色模式 | ✅ | CSS Variables 切换 |
| 中英双语 | ✅ | i18n + contentDir |
| 弹幕标签云 | ✅ | Canvas 动画 |
| 时刻页双模式 | ✅ | 在线发布 / 离线展示 |
| 数学公式 | ✅ | KaTeX 按需加载 |

---

## 五、图片

### 单张图片

![示例图片 1](https://picsum.photos/800/400?random=10)

### 图片配说明文字

![示例图片 2 — 山间清晨](https://picsum.photos/800/400?random=11)

### 多张图片展示

![示例图片 3](https://picsum.photos/400/300?random=12)

![示例图片 4](https://picsum.photos/400/300?random=13)

---

## 六、视频嵌入（7 种）

### 6.1 Bilibili 嵌入（video-bilibili）

通过 `video-bilibili` shortcode 嵌入 B 站视频，支持分 P：

```
{{</* video-bilibili bvid="BV1GJ411x7h7" page="1" */>}}
```

{{< video-bilibili bvid="BV1GJ411x7h7" page="1" >}}

### 6.2 Bilibili 嵌入（bilibili，支持弹幕开关）

`bilibili` shortcode 额外支持弹幕开关参数：

```
{{</* bilibili id="BV1x54y1e7zf" danmaku="false" */>}}
```

{{< bilibili id="BV1x54y1e7zf" danmaku="false" >}}


## 七、音频嵌入（5 种）

`music163` shortcode 支持单曲、歌单、专辑三种类型：

**单曲：**

```
{{</* music163 id="29746437" type="song" */>}}
```

{{< music163 id="29746437" type="song" >}}

**歌单（带封面列表）：**

```
{{</* music163 id="2829816518" type="playlist" */>}}
```

{{< music163 id="2829816518" type="playlist" >}}


## 八、代码高亮

### 8.1 带文件名和语言高亮（code shortcode）

{{< code lang="go" title="main.go" >}}
package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("Hello, Hugo Theme Molyun!")
	fmt.Println("当前时间:", time.Now().Format("2006-01-02 15:04:05"))
}
{{< /code >}}

### 8.2 Python 示例

{{< code lang="python" title="hello.py" >}}
def fibonacci(n: int) -> list[int]:
    """生成斐波那契数列"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

if __name__ == "__main__":
    print(fibonacci(10))
    # 输出: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
{{< /code >}}

### 8.3 普通代码块（Markdown 原生）

```javascript
// 原生 Markdown 代码块同样可用
const greeting = (name) => {
  return `你好，${name}！欢迎来到 molyun。`;
};

console.log(greeting("访客"));
```

---

## 九、数学公式

行内公式：质能方程 $E = mc^2$，欧拉公式 $e^{i\pi} + 1 = 0$。

块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

矩阵：

$$
A = \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{pmatrix}
$$

---

## 十、分隔线与段落

上方内容用了一条 `---` 分隔线。以下是更多文本排版示例。

这是一个短段落。

这是另一个短段落，用来展示段落间距。

---


