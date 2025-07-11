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

<style>
.categories-archive {
  margin-top: 2rem;
}

.categories-archive h2 {
  border-bottom: 2px solid #e8e8e8;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

.categories-archive h2:first-child {
  margin-top: 0;
}

.posts-list {
  list-style: none;
  padding: 0;
}

.posts-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.posts-list li:last-child {
  border-bottom: none;
}

.posts-list a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

.posts-list a:hover {
  color: #007bff;
}

.post-date {
  color: #999;
  font-size: 0.9rem;
}
</style>

<script>
// 处理 URL 片段跳转，确保中文锚点正常工作
document.addEventListener('DOMContentLoaded', function() {
  // 如果 URL 中有 hash，尝试滚动到对应位置
  if (window.location.hash) {
    var hash = decodeURIComponent(window.location.hash);
    var element = document.querySelector(hash) || document.getElementById(hash.substring(1));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
});
</script>
