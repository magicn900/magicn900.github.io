---
layout: default
title: "分类"
permalink: /categories.html
---

<div class="categories-archive">
  {% for category in site.categories %}
    <h2 id="{{ category | first | slugify }}">{{ category | first }}</h2>
    <ul class="posts-list">
      {% for post in category.last %}
        <li>
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
          <span class="post-date">{{ post.date | date: site.yat.date_format | default: "%b %-d, %Y" }}</span>
        </li>
      {% endfor %}
    </ul>
  {% endfor %}
</div>
