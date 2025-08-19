# 个人博客项目 (My Personal Blog)

这是一个基于 [Jekyll](https://jekyllrb.com/) 和 [jekyll-theme-yat](https://github.com/jeffreytse/jekyll-theme-yat) 主题搭建的个人博客。项目经过定制化，实现了自动部署、分类页面模板化和自定义样式等功能。

## 功能特性

- **响应式主题**：基于 `jekyll-theme-yat`，在桌面和移动设备上都有良好的阅读体验。
- **自定义页面**：添加了“分类”、“标签”、“归档”等独立页面，并优化了导航栏。
- **分类模板**：为“学习笔记”、“时光手札”、“创作”等主要分类创建了标准化的首页模板，方便快速添加内容。
- **自定义样式**：通过 `assets/css/my-kawaii-style.css` 文件实现了个性化的样式调整。
- **自动化部署**：使用 GitHub Actions 实现了 CI/CD。当代码推送到 `main` 分支时，会自动构建 Jekyll 网站并部署到 `gh-pages` 分支，最终发布到 GitHub Pages。

## 本地开发

### 环境要求

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/) (版本请参考 `Gemfile.lock` 中的 `ruby` 版本)
- [Bundler](https://bundler.io/)

### 安装与运行

1.  **克隆仓库**
    ```bash
    git clone https://github.com/magicn900/magicn900.github.io.git
    cd magicn900.github.io
    ```

2.  **安装依赖**
    使用 Bundler 安装 `Gemfile` 中定义的依赖项。
    ```bash
    bundle install
    ```

3.  **启动本地服务器**
    ```bash
    bundle exec jekyll serve --livereload
    ```
    启动后，在浏览器中访问 `http://127.0.0.1:4000` 即可预览博客。`--livereload` 参数会使你在修改文件后自动刷新页面。

## 如何撰写新文章

1.  **创建文件**：在 `_posts` 目录下创建一个新的 Markdown 文件。
2.  **命名规范**：文件名必须遵循 `YYYY-MM-DD-your-post-title.md` 的格式。例如：`2025-07-01-a-new-beginning.md`。
3.  **添加 Front Matter**：在每个文章文件的开头，你需要添加 [YAML Front Matter](https://jekyllrb.com/docs/front-matter/) 来配置文章的元数据。

    **基础模板：**
    ```yaml
    ---
    layout: post
    title: "文章标题"
    date: YYYY-MM-DD HH:MM:SS +/-TTTT
    categories:
      - 分类名称  # 例如：学习笔记, 时光手札, 创作
    tags: [标签1, 标签2]
    ---
    ```

    **示例：**
    ```yaml
    ---
    layout: post
    title: "我的第一篇技术博客"
    date: 2025-07-01 10:00:00 +0800
    categories:
      - 学习笔记
    tags: [Jekyll, 博客]
    ---

    这里是你的正文内容...
    ```

## 部署

本博客通过 GitHub Actions 自动部署。

1.  **触发部署**：将本地的修改（例如新文章、代码改动）推送到 `main` 分支。
    ```bash
    git add .
    git commit -m "你的提交信息"
    git push origin main
    ```
2.  **自动构建**：推送后，`.github/workflows/jekyll.yml` 中定义的 GitHub Actions 工作流会自动触发。它会完成以下工作：
    - 拉取最新代码。
    - 使用 `jeffreytse/jekyll-deploy-action` 构建 Jekyll 站点。
    - 将生成的静态文件（`_site` 目录的内容）推送到 `gh-pages` 分支。
3.  **发布**：GitHub Pages 已被配置为从 `gh-pages` 分支提供服务。构建完成后，网站会自动更新。

你可以在仓库的 "Actions" 选项卡中查看部署进度和日志。

---
*该 README 由 AI 编程助手协助生成。*
