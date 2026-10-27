# 项目结构与运行方式

项目使用 React、TypeScript、Vite、Tailwind CSS 与 TanStack Start。路由由 TanStack Router 根据文件生成；页面在构建时预渲染，部署时只发布 `dist/client/`，不需要 Node.js 服务。

## 开发与预览

需要 Node.js 22.12+，CI 使用 Node.js 24。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

开发服务默认在 5173 端口，静态产物预览默认在 4173。`npm run typecheck` 检查类型，`npm run test:content` 校验并生成文章数据，`npm run test:ocean` 检查动画曲线、尾部跟随与三只游动的边界。首次安装后先运行开发服务或构建，让 TanStack 更新路由树。

## 路由

| URL            | 路由文件                     |
| -------------- | ---------------------------- |
| `/`            | `src/routes/index.tsx`       |
| `/projects`    | `src/routes/projects.tsx`    |
| `/lab/manta`   | `src/routes/lab.manta.tsx`   |
| `/about`       | `src/routes/about.tsx`       |
| `/resume`      | `src/routes/resume.tsx`      |
| `/posts`       | `src/routes/posts/index.tsx` |
| `/posts/$slug` | `src/routes/posts/$slug.tsx` |

`src/routes/__root.tsx` 定义 HTML 文档和全局元数据，`src/layouts/SiteLayout.tsx` 定义导航与页脚。站内导航使用 TanStack `Link`。`src/routeTree.gen.ts` 由框架维护，不要手动编辑。

`/404` 用于生成静态托管需要的 `404.html`；客户端未匹配路由和不存在的文章也显示未找到页面。项目展示位于独立的 `/projects` 页面。首页使用独立的水下字符场景布局。`/lab/manta` 是带 noindex 的单只动作曲线调试页，不进入导航与 sitemap。

## 文章

文章放在 `content/posts/*.md`，使用 YAML frontmatter：

```yaml
---
slug: example-post
title: 文章标题
description: 文章摘要
date: 2026-10-21
author: Shawn Deng
tags: [devops]
---
```

slug 使用小写字母、数字和连字符，必须唯一。正文使用 Markdown，可包含 GFM 表格与代码块；当前不执行 MDX/JSX。图片放在 `public/images/`，正文使用 `/images/文件名.png`，渲染时统一加部署前缀。

`scripts/prepare-content.mjs` 校验元数据和本地图片，生成被 Git 忽略的 `src/generated/`。文章列表只加载摘要元数据，正文按文章分包加载。开发模式会监听文章变更；新增文章后重新构建即可生成对应静态页面。

## 部署

GitHub Actions 构建时默认使用 `/shawndeng_blogs/` 前缀。其他部署环境通过 `SITE_BASE_PATH` 设置，未设置时为 `/`：

```sh
SITE_BASE_PATH=/shawndeng_blogs/ npm run build
npm run preview
```

预览服务器读取构建时记录的路径前缀，验证真实静态文件，不使用 SPA 回退。生产托管服务也需要支持目录首页与 `404.html`，GitHub Pages 已满足这两个条件。

`scripts/finalize-static.mjs` 校验预渲染页面与链接前缀，生成 RSS、sitemap、404 和旧文章地址跳转。`/posts/Docker`、`/posts/K8S` 及其旧 `.html` 地址会指向新的小写 slug。

颜色与排版位于 `src/styles/global.css`。英文使用 JetBrains Mono，中文字符范围使用 Sarasa Term SC，字体与许可证本地保存。站点公开域名与 GitHub 入口位于 `src/lib/site.ts`；更换域名时也需同步更新静态导出脚本中的 origin。
