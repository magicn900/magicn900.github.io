---
layout: page
title: 创作
permalink: /creations/
---

## 创作

这里展示我的创意作品，包括小说、诗歌、绘画等各种创作内容。

{% for post in site.categories.creations %}
<article class="post">
  <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
  <p class="post-meta">{{ post.date | date: "%Y年%m月%d日" }}</p>
  <p>{{ post.excerpt | strip_html | truncate: 200 }}</p>
</article>
{% endfor %}

{% if site.categories.creations.size == 0 %}
<p>暂无创作作品，敬请期待...</p>
{% endif %}
