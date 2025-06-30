---
layout: default
title: 学习笔记
permalink: /study-notes/
---

## 学习笔记

这里分享我的学习心得、技术笔记和知识总结。

{% for post in site.categories.study-notes %}
<article class="post">
  <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
  <p class="post-meta">{{ post.date | date: "%Y年%m月%d日" }}</p>
  <p>{{ post.excerpt | strip_html | truncate: 200 }}</p>
</article>
{% endfor %}

{% if site.categories.study-notes.size == 0 %}
<p>暂无学习笔记，敬请期待...</p>
{% endif %}
