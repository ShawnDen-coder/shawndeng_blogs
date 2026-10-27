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

`/404` 用于生成静态托管需要的 `404.html`；客户端未匹配路由和不存在的文章也显示未找到页面。项目展示位于独立的 `/projects` 页面。首页、内页与实验页共用导航和页脚框架（最大 1120px）；首页个人介绍与内页共用 760px 阅读宽度，首页 Canvas 作为固定背景覆盖整个视口，导航、个人介绍和页脚叠在同一场景上；实验工作区使用宽版内容。`ocean.css` 不再覆盖导航和页脚。`/lab/manta` 是带 noindex 的单只动作曲线调试页，不进入导航与 sitemap。

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

## 主题与布局约定

参考 [Dao Ho](https://www.daoho.dev/) 的紧凑居中导航、场景与介绍分区，以及暖中性色。2026-10-27 核对参考站公开 CSS：浅色底 `#f5f4f1` / 文字 `#262523`，深色底 `#1a1917` / 文字 `#fff7f0`。沿用用户指定的 JetBrains Mono 与 Sarasa Term SC，不因设计扫描器的一般规则更换字体或添加图库素材。

导航右侧提供浅色、深色、跟随系统；默认跟随系统，选择存于 `localStorage` 的 `shawn-theme`，支持系统偏好更新与跨标签页同步。存储被禁用时仍可切换，刷新后恢复跟随系统。

`src/lib/theme.ts` 在文档 head 中提前设置 `data-theme` 与浏览器 theme-color，避免先绘制错误主题；React 挂载后由 `ThemeSelect` 接管选择。CSS 使用 `color-scheme` 与 `light-dark()` 的成对语义颜色，无 JavaScript 时仍跟随系统。Canvas 单独监听主题变化并重绘，不重建游动状态；静态 SVG 回退、实验页控件及曲线也遵循主题。

页面不能自行覆盖 `.site-header`、`.site-footer` 的宽度或间距。移动端统一使用品牌/主题一行、导航一行，始终保留直接访问各页面的入口；长文章出现滚动条时通过 `scrollbar-gutter: stable` 避免横向移动。

首页动画必须覆盖整个页面视口，不能重新拆成上方动画区与下方介绍区。`ocean-scene` 使用 fixed/inset 布局，位于共享 shell 的隔离层内，不截获点击；短横屏允许正文自然滚动，背景保持全屏。此要求来自 2026-10-27 用户提供的 Dao Ho 浅色首页截图。

## 场景层次与动作

保留三只蝠鲼、柔性翼面和被动尾部。画布大小与动物大小分离，投影焦距设有上限；近、中、远景使用不同深度，距离同时影响透视尺寸、字符细节、透明度、暖色比例及指针视差。材质固定在身体坐标中，明暗由变形曲面的法线计算；字符与底色方格分开绘制，共享深度缓冲处理遮挡。

`world.ts` 为每只独立选择巡航、短促推进与滑行的时长，平滑改变拍翼活动量和相位速度。相位时钟不重置，尾部历史使用真实时间，保存转向和拍翼速度。滑行逐渐展翼并靠惯性减速；同深度避让较强，不同深度可以前后穿行。点击只短暂影响附近动物，控件和文字选择不触发扰动。

文字、导航和页脚的实际 DOM 边界用于 Canvas 局部减淡，边缘有 48px 过渡。窗口尺寸、字体加载和滚动会更新这些区域。渲染以 30 fps 为上限并保留帧间余量；减少动态效果、后台标签页或离开首页时停止调度。
