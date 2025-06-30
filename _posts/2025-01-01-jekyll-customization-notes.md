---
layout: post
title: "Jekyll 主题定制学习笔记"
date: 2025-01-01 14:00:00 +0800
categories: study-notes
tags: [Jekyll, 网站开发, 前端]
---

## Jekyll 主题定制指南

学习如何定制 Jekyll 主题，打造属于自己的博客风格。

### 主要学习内容

#### 1. 主题结构理解
- `_layouts`：页面布局文件
- `_includes`：可重用的组件
- `_sass`：样式文件
- `assets`：静态资源

#### 2. 自定义样式
```scss
// 自定义变量
:root {
  --primary-color: #ff6b9d;
  --secondary-color: #a8e6cf;
}

// 自定义样式
.custom-header {
  background: linear-gradient(var(--primary-color), var(--secondary-color));
}
```

#### 3. 配置文件
`_config.yml` 是 Jekyll 的核心配置文件，可以设置：
- 网站基本信息
- 主题配置
- 插件设置

### 学习心得

通过这次学习，我掌握了：
1. Jekyll 的基本结构和工作原理
2. 如何定制主题样式
3. 如何配置导航和分类

下一步计划学习更高级的功能，如评论系统和搜索功能。
