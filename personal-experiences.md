---
layout: page
title: 时光手札
permalink: /personal-experiences/
---

## 时光手札

这里记录我的成长历程、生活感悟和重要时刻。

{% for post in site.categories.personal-experiences %}
<article class="post">
  <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
  <p class="post-meta">{{ post.date | date: "%Y年%m月%d日" }}</p>
  <p>{{ post.excerpt | strip_html | truncate: 200 }}</p>
</article>
{% endfor %}

{% if site.categories.personal-experiences.size == 0 %}
<p>暂无个人经历文章，敬请期待...</p>
{% endif %}
