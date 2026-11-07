# 实现与验证记录

日期：2026-11-07。代码位于 `personal-site-redesign`，尚未发布。

## 交付与审查

- Cody 设计基线 `67d38aa` 经 Coco 二审通过；后续图稿和说明补充至 `1f300629`，已随实现收录。
- Cindy 实现与修复：`22cf9ca`、`35e6fea`、`a8aa73c`。
- 当前任务分支对应集成提交：`441f567`、`cc929fd`、`aaf5e16`。
- Coco 代码审查发现两项 Important：运行期绘制失败未退化；滚动绘制绕过限频和预算。Cindy 已修复，主会话读取实际调用链并重跑相关回归测试。没有将作者自查或模块测试描述为浏览器验收。

## 当前分支实际通过的检查

- `npm run test:undertow`：产品实际使用的调度、受保护绘制、一次性失败退化、缓存泡沫交替、滚动突发合并、静态单帧、隐藏页、缓存预算提前退出，以及 controller 与绘制接口的组合调用。
- `npm run test:content`、`npm run typecheck`、`npm run test:ocean`、`node scripts/test-pele.mjs`、`git diff --check`。
- `npm run build` 和 `SITE_BASE_PATH=/shawndeng_blogs/ npm run build`。预渲染需要本地监听，构建在受审权限下执行；两种 base 均由 finalize 脚本确认文章旧地址、RSS 和 sitemap。
- 最终子路径静态预览：8 个公开页面、21 个页面引用资源及 CSS 字体响应正常；首页包含原姓名与介绍、项目和两文；旧 `.html` 地址、RSS、sitemap、OG 资源正常；未知地址返回 404。
- `scripts/fixtures/pele-preview.html` 未进入生产输出，生产预览请求该路径返回 404。

这些检查不是 React 挂载测试，也不是 GPU、真实字体或动效观感的证据。`test:ocean` 只用作既有 Manta 模块回归。

## 本地查看

- 网站：`npm run preview -- --port 4177`，入口 `http://127.0.0.1:4177/shawndeng_blogs/`；已向当前 Lody 会话报告 Browser 预览候选。
- Pele：构建后运行 `node scripts/generate-pele-preview.mjs`，再运行 `node scripts/serve-pele-preview.mjs`，默认端口 4176。夹具有浅/深主题与 320/760px 容器，以及中文、英文和长标签。
- 网站与夹具使用不同端口。预览报告不代表远程通道已就绪。

## 尚未取得的验收证据

当前 CUA 返回应用和浏览器清单为空，无法采集真实产品截图、录屏或浏览器交互结果。因此以下项目仍待验证：

- 两参考站的真实画面与运动观察；已有依据是保存并指纹核对的公开源码，不能称为亲眼观察。
- 桌面/手机、浅/深主题、320/768px、200% 文字放大下的实际排版、字体、焦点、对比与 Pele 横向滚动。
- 实际 React 路由往返、主题矩阵、暂停/恢复、系统减少动态效果，以及强制 GPU/Canvas 故障的浏览器表现。
- 自然运动、CPU/GPU 整帧预算、帧间隔和性能降级的真实设备数据。40ms 缓存预算按批次检查，是提前退出策略，不是硬实时保证。
- Linux 大小写敏感文件系统上的旧地址兼容。

代码与静态产物可供查看；以上项目没有标为通过，也没有进行部署或发布。
