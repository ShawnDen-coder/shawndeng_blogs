# Shawn 个人网站设计研究与实施方案

作者：Cody · 修订：2026-11-07 · 交接：主会话 → Coco 二审 → Cindy 实施

**状态：基于公开源码的具体实施稿；实站截图与运动观察仍未完成。** 本版替代前三次提交中的880px容器、176px区块侧标题、暖灰色和未定背景建议。已读取主会话成功取得的两站 HTML/CSS/JS；下述确定值有源码依据，不能再把它们标为未知，也不能声称亲眼看到过实际渲染。

不写产品实现代码、不创建角色 session、不主动 session_chat。Coco 通过后由主会话交 Cindy，不新增用户审批。Coco 二审采用固定源码引用（文件、选择器/函数）＋逐项设计映射＋浅深主题桌面/手机图稿＋明确动效/降级参数的证据组合，不要求远端截图先行。Coco 可审查并决定源码依据的实施范围；“可实施”与“完成实站视觉验收”分开记录。截图缺失是明确的视觉验收限制，不作为新增用户批准门槛，也不自动禁止 Coco 批准进入实现。

## 1. 基线、来源层级与证据保存

- 当前设计 worktree 分支 `session/52a2efd7`，仓库读取基线 `793e9dffcbd55e83eb8bea6cb2e44c454cbebde5`。主 worktree 已由 `session/639156e5` 改为 `personal-site-redesign`，本工作不依赖重新命名。
- 保留 React 19 / TypeScript / Vite 8 / Tailwind 4 / TanStack Start/Router、静态预渲染与 GitHub Pages 部署。不新建框架、CMS、远程内容服务。
- **[R] 仓库事实：** 个人叙述、一个网站项目、Docker/K8s两文、简历整理中、现有路由及主题实现。
- **[S] 参考源码确认：** 主会话通过受审网络权限 curl 获取 `/tmp/personal-site-{omavashia,empryo}.html` 及 `/tmp/personal-site-reference-assets/`。Cody 读取核对；永久证据见 [source-findings.md](evidence/source-findings.md)，包含原URL、2026-11-07核对日期、完整输入文件SHA-256、必要属性/数值及机制摘要。**不把整个HTML、bundle或shader搬进仓库。**
- **[V] 视觉实测：** 当前没有。先前 Chrome 导航报 timeoutMs 错误，后续本会话 inventory 为空；详见 [access-log.md](evidence/access-log.md)。主会话亦报告相同控制故障。
- **[C] 上下文背景：** Python→TypeScript全栈、FluxCD/GitHub管理Homelab来自 Owner Context Bundle；不标成用户本轮原话。默认不作为本轮新增公开文案，也不替换本人定位。若后续考虑采用为首页内容，必须标为编辑建议及其来源，不能写成本轮用户原话或仓库已发布事实。
- **[D] Cody 适配决定：** 路由替代tabs、保留字体、没有头像则省略、桌面/移动性能档位、文章阅读布局与受保护静帧。均在下文显式说明。
- Nowledge 检索已尝试，MCP返回Space迁移错误，未返回记忆；没有借助不可验证记忆补造个人资料。

## 2. 两参考站：源码确认、映射与未完成观察

### 2.1 Omavashia：身份栏 + 内容面板，而非分节侧标题

来源：[原站](https://omavashia.com/)；证据 O1。

| 源码确定的结构 | 本站适配 |
|---|---|
| 总框小屏max420px、md max900px、lg max980px | 默认个人网站共享内容框采用420 /900 /980阶梯，取可用宽度与上限较小值 |
| md=48rem、lg=64rem；通常根字号16px即768/1024px | 使用48rem/64rem断点，不仅按设备名判断 |
| md左栏250px、lg左栏280px；gap64/96px；右栏flex:1/min-width:0 | 左侧身份资料，右侧真实路由内容。大屏980−280−96=604px右栏 |
| 顶部home/projects/open source/experience/writing/videos/reading；部分为tabs、部分为链接 | 顶部只留首页/项目/文章/关于/简历五个真实路由链接，不增加没有内容的栏目 |
| 右侧panels在同一grid area，非活动panel隐藏/高度0 | **不移植隐藏panel系统**；TanStack Router只渲染当前路由，不把所有页面装进tab状态 |
| 移动整体从左右变上下；个人资料内部照片/文字横排，桌面变纵排 | 无已核实头像，省略照片；移动身份文字按自然顺序在上、内容在下，不造头像占位或强撑左右照片结构 |
| 参考有履历、开源与贡献信息 | 不复制对方数据和内容密度；本站仍只展示一个项目、两篇文章 |

上述是SSR/CSS布局证据，不是浏览器测量。实际断行、字体渲染、移动裁切与tab交互未实测。旧稿的“每节176px侧标题+长纵向首页”已取消，不用该结构冒充参考。

### 2.2 Empryo docs：Undertow冷灰蓝 + 低强度海岸场景

来源：[原站](https://empryo.com/docs)；证据 E1–E5。

- boot 的场景声明为 `habitat: The beach`，tagline 描述阴天海岸、冷浪、白色泡沫与湿黑岩面；这确认环境意图，仍非实际画面观察。[S:E1]
- HTML根为 `data-world="undertow" data-theme="dark"`；这说明响应默认状态，bootstrap仍可按偏好改变最终状态。
- Undertow浅/深palette均在inline critical CSS中，boot JS中有对应色板。本站直接映射这些语义色值，见第6节；不再沿用原暖灰值充当参考色。
- docs容器 `data-intensity="calm"`；ready canvas CSS opacity=.34，fixed/inset:0/pointer-events:none。普通ambient=.6不适用于这个docs参考。
- Undertow优先WebGL2生成潮线、两层泡沫、湿岸和细纹；不支持时使用Canvas2D缓存纹理漂移。不是ASCII鲨鱼、星点粒子或模糊光团。
- 文本/媒体/控件生成阅读mask；calm档最多擦除98.5%的背景。不能只采用海浪而丢掉阅读保护。
- worker/offscreen与main-thread均有实现分支；boot按能力检测选择路径。Worker的onerror仅报告错误，未见自动切换主线程，因此不能称“Worker启动失败自动fallback”。源码分析不证明本设备走哪个分支，也不证明实际帧率。

### 2.3 还需补齐的实测证据

两站各需1440×900、390×844首屏/全页截图；另查768px过渡。Empryo需同构图t0、约2s、约6s帧并连续观察至少10s，记录主题、DPR、实际时间差、滚动和鼠标响应。后续视觉验收的截图必须来自真实站点，不以本稿草图替代；这些取证尺寸是后续核验安排，不追加独立的用户批准流程。外观、动画密度、实际裁切与性能仍不可核验；记录失败不等于宣布原站离线。

后续截图若与保存源码不同，先核查原URL版本、最终world/theme、视口与用户偏好；用证据修订数值，不反向解释画面来维护草图。当前源码结论已足够形成下面的可实施设计。

## 3. 唯一推荐方向：冷岸上的创作与工程札记

- **Product：** 先认识邓辉 / Shawn 的本人叙述，再读真实项目与技术文字；导航直达已有内容。
- **Character：** 坦诚、沉静、深入；不制造头衔、成果数字或履历密度。
- **World：** 左侧从影视后期到创作工具、平台与AI工作流的个人叙述；右侧个人网站和容器笔记；环境为Undertow冷岸。
- **Moments：** 左侧姓名和定位是第一焦点，右侧真实项目与两文是第二焦点；海浪经过空白、在阅读区消退。
- **Signature：** 保留 `shawn.`、中文姓名、原文链接与现有等宽字体。不开创无资料支撑的个人图腾。

本版使用 brainstorming / interface-craft / design-taste-frontend 的内容真实性、层级、静态先行和截图验证方法。先前quiet-instrument随机方向只保留为探索历史，**不再主导构图**；用户指定的两个参考及其可查源码优先。无图库配额、无强制八段入场动效。

### 3.1 对旧锁定稿的覆盖与保留

`design/homepage-layout.md` 是此前Cody/Coco锁定稿。当前参考需求覆盖下列视觉决定，其他约束继续生效。

| 旧决定 | 本版明确处理 |
|---|---|
| 单屏编辑式介绍、左六栏坐标 | 改为左身份/右内容；两栏从md开始；取消初稿176px侧标题布局 |
| 全站1120px共享框 | 默认个人页面共享框改为420/900/980；header/footer由共享shell统一调整，禁止页面各自覆盖。实验工作区可继续1120 |
| 首页姓名40px及旧绝对坐标 | 姓名改为侧栏适用32px，移动28px；Shawn独立行24/16px；文字自然流动 |
| 暖中性/陶土色值 | 改为Undertow冷灰蓝成对色值，保留语义tokens而非新增平行主题系统 |
| ASCII鲨鱼形态、三层数量 | 首页替换为Undertow潮线/泡沫场景，只运行一种；保留旧源码及许可，无须本轮删除 |
| 姓名、影视后期出发原文及三入口 | **保留**，不改成Python/TS或AI/DevOps标签简介 |
| 五导航、真实内容、文章和旧地址 | **保留**，新结构不授权改slug、迁内容或添加假tabs |
| JetBrains Mono + Sarasa | **保留**；不复制两参考站字体 |
| 全视口背景、阅读保护、暂停/低性能/reduced-motion/隐藏页 | **保留并落实**；采用参考calm的更强阅读抑制 |
| 三态主题/bootstrap/跨标签/快速连切 | **保留**；原240ms/上限280ms主题揭示不跟随参考较长切换时长 |
| 文章760px阅读上限、Markdown/GFM/原PNG/构建期Pele | **保留**；文章详情独立阅读布局，无侧栏压缩代码 |
| `/lab/manta`实验逻辑、noindex | **保留**；不重做实验场景 |

## 4. 布局与真实文案：以路由切换内容，不以tabs伪装页面

### 4.1 共享页头

- 共享框公式：小屏 `min(420px, 100% - 48px)`；md `min(900px, 100% - 96px)`；lg `min(980px, 100% - 160px)`。320px可把单边留白降至20px。[S布局上限与留白，D窄屏适配]
- 第一行为字标 `shawn.` 与右侧主题select；下一行为五个真实路由：`首页 / 项目 / 文章 / 关于 / 简历`。导航位于左右两栏上方，不藏入侧栏。[D：为保留既有字标与三态控件多一行]
- 导航使用TanStack `Link`、`aria-current=page`，不使用role=tab/tabpanel、aria-selected或隐藏副本。点击产生真实URL，支持刷新、历史、新标签打开与无JS静态链接。
- 桌面五项沿整个框均匀分布；手机直接可见，320px/200%放大时3+2换行，不复制参考横滑隐藏滚动条的做法。命中区至少44×44。
- 页头与正文间48px；移动32px。首屏不锁100vh，无延迟展示。

### 4.2 左侧身份栏（所有概要路由共用）

适用 `/`、`/projects`、`/posts`列表、`/about`、`/resume`。md左栏250px/lg280px，不sticky，不为了填满屏幕加项目数量。

**完整可发布文案 [R：src/routes/index.tsx]：**

> 你好，我是邓辉
>
> Shawn.
>
> 从影视后期出发，现在构建创作工具、平台与 AI 工作流。
>
> 喜欢把难题弄明白，做些真正能帮上忙的东西。

- 「影视后期」继续链接`/about`；「创作工具、平台与 AI 工作流」继续链接`/projects`。
- 三个原入口：`GitHub ↗` → `site.github`；`更多关于我 →` → `/about`；`查看简历 →` → `/resume`。
- 桌面三个入口纵排，每项至少44高；手机可2+1换行，每项仍44高，不为三项挤一行而缩字。
- 首页姓名是唯一H1，`Shawn.`是其内独立行。其他概要路由姓名改为普通段落，右侧路由标题才是该页H1；避免两个H1。
- 不造头像，不增加在线/接单状态、城市、工作年限。原叙述不因缺少PDF履历就被删除，也不扩写未经记录的职位成果。

### 4.3 首页右侧内容（仅两个真实区块）

右栏md flex剩余宽度、lg满980框时604px；左身份与右内容顶对齐，间距64/96px。右侧各区块标题在正文上方，**不再拥有一列小标题**。

**区块1：正在构建**

- H2 `正在构建`；H3/项目链接 `这个个人网站 ↗`。
- 正文：`用代码整理自己的经历、项目与文字。也把构建过程，作为一次持续的工程实践。`
- 技术行：`React / TanStack Start / Tailwind CSS`。
- 外链：`https://github.com/ShawnDen-coder/shawndeng_blogs`；区块末尾 `项目页 →` → `/projects`。
- 全部来自 `src/routes/projects.tsx`。不展示假封面、成果指标或第二/第三项目。

**区块2：技术文章**

- H2 `技术文章`；引导句 `动手实践中的记录，和解决问题时留下的思考。`，来自 `/posts`。
- `k8s 基础入门` / `2025-03-01` / `Kubernetes 常用命令与集群操作的基础实践。` → `/posts/k8s`。
- `Docker 基础入门` / `2024-08-19` / `Docker 镜像、容器与日常清理的基础实践。` → `/posts/docker`。
- 来自两个Markdown frontmatter，复用生成metadata日期降序；首页最多3篇，当前只显示2篇；`全部文章 →` → `/posts`。
- 桌面日期在标题右侧，可自然落行；小屏默认标题下日期再摘要。日期用14px次正文色，不用对比临界的淡灰。不要把2024/2025日期写成“近期活跃”。

右侧区块间64px，标题到内容24px、段落间16px、文章条目间32px。没有第三个“当前方向”公开区块：Python/TS及FluxCD背景只留设计上下文，待仓库真实内容补齐再发布。无贡献热图、履历/开源/视频/阅读空tab。

### 4.4 其他路由的右侧内容

- `/projects`：原项目页内容，仍只有一个项目；右侧H1“项目”，不把首页摘要与完整页重复叠加。
- `/posts`：右侧H1“文章”和完整列表，不受首页limit影响；没有tabpanel缓存所有文章。
- `/about`：保留原AI Agent、DevOps、Homelab三段真实内容；作为创作与工程定位的补充。
- `/resume`：保留“简历正在整理中”和GitHub入口；没有PDF不显示下载。
- `/posts/$slug`：切到独立居中阅读布局，最大760px，无身份侧栏；共享页头/页脚仍同一规则，正文760是显式阅读例外。首屏静态就有文章，不运行首页背景。
- `/lab/manta`：现有实验工作区与1120px宽上限继续，不新增导航入口。

### 4.5 移动与页脚

- <48rem：身份在上、当前路由内容在下；省略参考照片后采用纯文字自然堆叠。身份与内容间48px，不保留空左栏。
- 页脚在内容之后自然流，单一共享框；保留 `© {年份} Shawn Deng`、RSS、`保持好奇，持续构建。 ↗`。
- 仅首页显示暂停背景控件；正常和降质后仍动画的状态都提供“暂停背景”，用户暂停且允许恢复时提供“继续背景”；只有系统减少动态效果、最终静帧或失败等强制静态状态显示“背景已静止”及原因。降低帧率、分辨率或密度不等于强制静态。详见第7.3节状态表。

## 5. 路由、内容与部署契约

保留 `/`、`/projects`、`/posts`、`/about`、`/resume`、`/posts/docker`、`/posts/k8s`、`/lab/manta`、`/404`；保留未知slug not-found、大小写旧 `/posts/Docker`、`/posts/K8S` 及 `.html` 跳转。新布局不改历史URL，不把页面换成首页hash锚点。

- Markdown/GFM表格、代码块、正文和原PNG保持；构建期Pele保持，浏览器不加载Mermaid。现有两文无Mermaid围栏，不为了演示改文章。
- `pageHead` 的canonical、OG title/description/url/image与 `og.svg`、RSS、sitemap、404继续；`/lab/manta` noindex并排除sitemap。
- `SITE_BASE_PATH`同时支持 `/` 与 `/shawndeng_blogs/`。内部导航用`Link`；资产用`assetUrl`/构建import；字体不能硬编码部署根地址。
- `src/routeTree.gen.ts`由框架生成；文章完整正文仍按路由分包，首页只读metadata。

## 6. 颜色、type、spacing tokens（本版确定值）

颜色来自Empryo Undertow源码 [S:E1]；下面是本站语义映射。不是截图取色；默认仍跟随系统，不把参考响应深色强制成本站唯一主题。

| 本站token | light | dark | 参考变量/用途 |
|---|---|---|---|
| `--ui-bg-page` | `#f4f6f8` | `#0c0e11` | paper |
| `--ui-bg-header` | `#e9edf1` | `#08090c` | paper-sunken，代码底/必要表面，页头自身透明 |
| `--ui-bg-elevated` | `#fbfcfd` | `#1a1f26` | paper-raised |
| `--ui-bg-soft` | `#e9edf1` | `#1a1f26` | inline code等，复用现有表面 |
| `--ui-bg-muted` | `#dde5ec` | `#1c242c` | pigment-deep |
| `--ui-text-primary` | `#1a2028` | `#e8ebee` | ink |
| `--ui-text-secondary` | `#4a5560` | `#adb5bf` | ink-soft，正文/日期/技术行 |
| `--ui-text-muted` | `#67727d` | `#838c97` | ink-faint，只用于已保护实底上的次要信息 |
| `--ui-border` | `#cdd5dc` | `#2a323c` | rule，仅表格/控件必要边界 |
| `--ui-info` | `#43667f` | `#8fadc4` | info，链接与焦点 |
| `--ui-accent` | `#4a6a80` | `#98b0c2` | pigment |
| `--ui-accent-hover` | `#43667f` | `#e8ebee` | 采用同色板info/ink，D角色映射 |
| `--ui-text-on-accent` | `#fbfcfd` | `#0c0e11` | on-pigment |
| `--scene-pigment-alt` | `#914d5e` | `#c49aa4` | pigment-alt，预留，不给标题/按钮加粉色强调 |

`--ui-accent-soft`由当前accent的12%/18%透明度生成 [D]。旧暖灰/陶土hex不再是新主题默认。同步theme.ts、head theme-color、静态fallback和Pele映射，避免CSS已换色而Canvas/浏览器栏留旧色。

按sRGB相对亮度公式计算，当前**实色底**的主字/正文/淡字/链接对比分别为浅色15.13/7.02/4.53/5.63，深色16.15/9.33/5.67/8.23:1。淡字浅色仅略过4.5，因此日期与重要次级信息统一使用secondary，不把4.53当动态合成已达标。

字体保留 `JetBrains Mono, Site Sarasa, monospace`、400/600字重与现有unicode-range。参考字体不复制。

| 角色 | md/lg | 小屏 | 行高 |
|---|---|---|---|
| 身份中文姓名 | 32px | 28px | 44/40px |
| 身份Shawn. | 24px | 16px | 32/24px |
| 右侧路由H1 | 28px | 26px | 1.4 |
| 区块H2 | 20px | 20px | 30px |
| 项目/文章H3 | 18px | 18px | 28px |
| 介绍与正文 | 16px | 16px | 30px |
| 日期、技术行、导航 | 14px | 14px | 22px；命中区另补44高 |

Spacing：4/8/12/16/20/24/32/40/48/64/80/96px。身份内部正文段距16，标题/介绍24；侧栏与正文gap64/96；右区块64。Radius按钮4/代码6；无毛玻璃、渐变文字、发光描边。Focus 2px info、offset4；hover160ms，focus立即。动效关掉后布局不变。

## 7. Undertow背景：确定的机制与本站实施决定

### 7.1 参考算法证据 [S:E3–E5]

entry→boot→worker或main-thread→Undertow工厂的导入链已核对。WebGL2 shader以5层FBM扰动潮线、邻近特征点距离差构成泡沫网纹、两级泡沫叠加、岸面grain/ripple与湿润带混合。`phase=fract(t×0.026)`，涨落分段0→.35→1，潮线约为 `0.60−0.24×reach+wiggle`；深色材质deep #0d0e0f/mid #2b2e30/foam #e4e6e7/rock #0a0a0b。浅色用Undertow pigment、ink、paper混色及白泡沫。

WebGL2失败时，参考以低分辨率base/swell两张noise纹理缓存叠加，轻微漂移并使两组半周期错开的swell以sin²透明度变化。参考still固定内部t=31；滚动越深背景渐弱；该工厂的splash/cue为空方法，不应添加点击涟漪。

calm源码energy=.36、时钟推进系数=.808，据公式推算WebGL潮汐循环约47.6s；这是理论估算，不是实测。2D备用循环参数不同，不将两条分支混为一个精确周期。

### 7.2 本站实现蓝图 [D，以已确认机制为基础]

1. **首页专用，替代鲨鱼。** 一个fixed/inset:0装饰层，`aria-hidden`、`pointer-events:none`，位于隔离shell下层。其他路由卸载场景，保持纯底色阅读。
2. **原生WebGL2主路径，不加Three.js。** 独立实现潮线/FBM/网状泡沫/湿岸，不复制参考bundle或完整shader。使用离屏WebGL画布，合成到可见Canvas2D，便于统一阅读mask；正文不等待GPU初始化。
3. **固定参考calm气氛。** 可见层opacity初值.34；使用上述深色材质。浅色deep=mix(pigment,ink,.25)、mid=mix(pigment,paper,.42)、rock=mix(paper-sunken,pigment,.08)、foam白。背景整体与paper再混合，深色32%、浅色18%的paper份额沿参考。内时按dt×.808前进，dt截断≤.1s；主题切换保留相位。
4. **海岸方向。** 顶部岸面、下方水体，潮线随时间在视口高度约36%–60%附近往返并由noise扰动；照片级细节不是要求，轮廓、退潮/涨潮和泡沫可辨为目标。归一化坐标按aspect修正，小屏重新取样，不把桌面大图裁成窄条。
5. **质量档。** WebGL内部采样比例.55/.45/.35，内部宽上限1700；小屏初始medium。可见合成Canvas DPR≤1.5。GPU上下文丢失进入备用，不无限重建。本站自行处理WebGL创建失败、shader编译/链接失败及运行异常：捕获错误、清理资源后尝试2D备用；备用初始化/绘制失败则隐藏装饰、保留实色底，并统一更新强制静态原因。不能依赖参考站存在的能力分支来代替失败处理。
6. **2D备用。** 不具WebGL2但有Canvas2D时，一次性生成base/swell噪声缓存；桌面初始700×440，移动按竖向440×700，低档480×300交换方向；只变换与叠加，不每帧计算所有像素。生成超过初始化预算或不可用则直接实色背景。
7. **静态路径。** reduced-motion/手动暂停保留当前受保护帧；初始静态用t=31。GPU丢失或无Canvas时用受保护2D静帧；mask未就绪、JS禁用或任何回退无法保证对比时隐藏装饰，只留实色底。SSR纯底色是合法最终回退，不闪出未经保护的浪纹。
8. **阅读保护。** profile、右侧正文、导航、主题和页脚采用共享几何图；保留旧外扩24px+过渡48px的最小保护范围，目标擦除98.5%（与参考calm一致，比旧“最多残留14%”更保守）。全部文字区参与，不只旧ocean-intro。更新由字体ready/resize/内容/滚动触发，缓存几何，不逐帧读DOM。
9. **随滚动退场。** 强度从首屏1渐变到scrollY≥1.4个视口高度时.45，不锁滚动、不移动正文；阅读mask与静帧同样随文档位置更新。
10. **省去参考的复杂全站功能。** 不增加多world切换、页面cue、点击splash、长达1.6/2.4s入场或参考独立持久化keys。本站先用main-thread分支与预算降级；不预设Worker。若实测主线程无法达标则降静态，Worker留作另行有证据的优化，不阻塞内容交付。

### 7.3 性能、状态与退化

- 目标桌面15fps、手机12fps [D；参考calm调度约15fps，移动保守降档]。仍保留旧CPU更新+合成预算p95≤6ms/4ms，均未实测；30/20fps不再是本稿运行目标。
- 最近60次实际更新/合成时长取p95，连续两窗口超预算降一级，低档仍超则静帧；本次SPA会话只降不升。WebGL调用的JS耗时只覆盖CPU提交，不能单独证明GPU或整帧预算。须同时看真实帧间隔、长任务；可用时用GPU timer查询排除异步误判，无法确认稳定时选静帧。
- Save-Data（可用时）、320px、手机高度<700px、reduced-motion初始静态；无deviceMemory API不报错。
- 隐藏页取消RAF/计时器，返回不追赶离开时间；unmount清理renderer、监听器、纹理/程序/位图，异步初始化用失效标记阻止卸载后回写。
- 绘制门禁先检查首页挂载、页面可见与主题临时冻结；随后检查强制静态原因（reduced-motion、最终性能静帧、Save-Data/窄小视口静态策略或失败），再检查userPaused。medium/low质量档仍可运行，不是强制静态。主题冻结结束不能覆盖用户暂停或强制静态；按钮文案不因暂时冻结而改变。
- `test:ocean`主要测Manta world/geometry/appearance，不涵盖首页renderer、fallback、React生命周期、暂停或真实帧率；不得用它宣称本节通过。

### 控件与绘制状态表（本表统一替代旧稿§5F/§8的冲突）

| 条件 | 绘制状态 | 首页控件 |
|---|---|---|
| 正常质量、userPaused=false | 动画 | 可操作“暂停背景” |
| medium/low档降低分辨率、帧率或密度，仍允许动画 | 动画 | 同样可操作“暂停背景”，不能改成静止说明 |
| userPaused=true，且无强制静态原因 | 保留受保护静帧 | 可操作“继续背景”，恢复既有质量档 |
| reduced-motion、最终性能静帧、Save-Data/窄小视口静态策略、初始化/上下文失败导致强制静态 | 静帧或纯底色 | “背景已静止”及可访问原因，不提供无效继续按钮 |
| 页面隐藏或主题短暂冻结 | 暂停调度 | 保持根据用户偏好/强制原因得到的控件语义，不反写userPaused |
| 非首页 | 卸载renderer | 不展示首页背景控件；共享状态仍保留 |

强制静态优先于“继续背景”文案；限制消失后仍读取原userPaused，不自动取消用户暂停。质量下降与最终静帧是两个不同状态，不以`quality !== high`判定强制静态。

### 两项既有源码风险：必须在实施时验证并处理

已使用 systematic-debugging 追踪到下面的数据路径；尚未在真实浏览器复现，不把源码风险写成已观察到的视觉故障，也不声称本轮修复了它们。

**S1：静态 fallback 没有动态背景的阅读区保护。** `SharkScene.tsx` 的 Canvas 绘制读取 `.site-header`、`.ocean-intro`、`.site-footer` 边界并逐字符减淡；返回的 `.shark-fallback` `<pre>` 不使用这些区域。`ocean.css` 只给它固定百分比位置和 `.4` 透明度，移动端改位置与字号。因而“动态画面可读”不能证明 JS 未加载、Canvas 失败或降级静帧时仍可读。

- 最终动态层与静帧层共享同一套阅读区几何、主题和强度规则；不要为 fallback 另写一组固定百分比位置来假定永不碰文字。
- 静帧可以复用同一投影/绘制函数只绘制一次，或让静态 SVG/CSS mask 使用同一缓存区域；Canvas 不可用时不能把 Canvas 单帧当唯一回退。
- **保护区域未就绪、JS 禁用、mask 不支持或静帧无法满足对比时，隐藏装饰图形，仅保留实色页面底。** 阅读安全优先于“同构图”；这是上述同构图规则的明确例外。不得先显示未经保护的高对比图形再等待测量。
- 字体加载、内容换行、窗口 resize、滚动、主题变化后，静态保护仍同步；这允许按需单次更新，不允许恢复持续动画。
- 新首页身份栏与右侧内容区块、文内链接、导航和页脚均在同一保护模型内；静帧不能仍只保护旧的 `.ocean-intro`。

**S2：暂停状态存在两个所有者。** `SiteLayout.tsx` 与 `routes/index.tsx` 各自 `useState(false)`；页脚更新自己的值并发送无载荷 `scene-toggle`，首页收到后翻转另一份值。如果共享 layout 留存、首页离开后重新挂载，首页可能恢复 false，而页脚仍保留 true。

- 推荐由稳定的 `SiteLayout` 上下文统一持有 `userPaused`、质量档与本会话最终性能静态标记，Provider 覆盖页脚和其 `children` 中的首页；首页只读取，不再初始化第二份暂停值，不用无载荷广播翻转。
- `userPaused` 是用户偏好；`effectiveMotion` 由首页是否挂载、可见性、系统偏好、性能档位、主题冻结和 `userPaused` 一起派生。不能把受限导致的静止反写成“用户已暂停”。
- 离开首页销毁 renderer，但保留该 SPA 会话中的偏好与已触发的性能降级；返回后读取同一份状态。完整刷新可重新初始化用户暂停为 false并重新评估质量，仍受系统减少动态效果和当前设备策略约束；不新增永久存储或跨标签暂停同步。
- 控件和场景消费同一个状态快照：允许动画且已手动暂停时为“继续背景”；动画运行时为“暂停背景”；系统或最终性能静帧等强制原因禁止恢复时为“背景已静止”及可访问的原因，不显示能恢复却不生效的按钮。
- 验证序列：进入首页→暂停→进入 `/posts`→返回首页→浏览器后退/前进→切主题→resize。每一步同时检查按钮文字、用户偏好和实际 RAF/绘制状态，不能只看按钮。


## 8. 响应式与无障碍验收设计

- 1440px：980框，左280/间96/右604。1024px：因外侧80×2只剩864，右488，仍可容纳16px正文。768px：可用672，左250/间64/右358；此时日期换行，正文不缩字。
- <768px：420上限、边距24；390可用342，320边距20可用280。页头两行直接导航，身份→内容，所有内容自然增高。
- 200%文字缩放或有效宽度不足时允许提前堆叠两栏，不用固定高度/nowrap保布局；中文姓名可换行，Shawn始终独立行。32/28px是正常尺寸，不在放大时强制两行裁切。
- 语义header/nav/main/footer与skip link保留；每页一个H1；profile在非首页降为段落。没有tab键盘陷阱或aria-selected伪状态。
- 正文合成对比≥4.5:1、大字/必要UI≥3:1；动/静态最亮和最暗帧都验。focus清晰；纯底色回退始终可用。
- 原文内链加下划线或明确链接样式；箭头aria-hidden，链接有完整文字。键盘顺序与DOM顺序相同。
- forced-colors使用系统文字/焦点并隐藏装饰；reduced-motion无主题揭示/入场，仍能直接切主题。

## 9. 组件与文件范围（Cindy实施）

| 文件 | 具体职责 / 边界 |
|---|---|
| `src/layouts/SiteLayout.tsx` | 共享420/900/980框、字标/主题行、五真实路由导航、页脚、稳定暂停Provider；不保留两套独立paused |
| `src/layouts/ProfileLayout.tsx`（新） | 250/280px身份+flex内容，概要路由共用；文章详情/实验页显式例外，无tabs |
| `src/components/ProfileIntro.tsx`（新） | 精确保留index.tsx姓名、两句原文和内链/三入口；依据路由选择姓名H1或p |
| `src/routes/index.tsx` | home profile右侧项目摘要+文章metadata；只有首页挂载背景 |
| `src/routes/projects.tsx`、`posts/index.tsx`、`about.tsx`、`resume.tsx` | 使用ProfileLayout，保留原内容及route head；不新增经历与PDF |
| `src/components/PostList.tsx` | 可选limit与标题语义；默认完整列表，首页最多3篇 |
| `src/lib/profile.ts`（可选） | 原简介/项目共享数据与来源注释，避免首页和项目页复制后漂移；不收录context背景成发布事实 |
| `src/components/background/UndertowScene.tsx`（新） | 初始化/销毁、可见性、静帧与降级，Canvas aria-hidden |
| 同目录 `undertow-renderer.ts` / `undertow-shader.ts`（新） | 原创实现潮线/泡沫主路径、2D缓存备用、阅读mask；不引入参考bundle或重型库 |
| 同目录 `ScenePreferences.tsx`（可选新） | stable provider中userPaused与质量档；派生effectiveMotion与原因，不新增永久key |
| `src/styles/global.css` / `home.css`（新） | Undertow语义tokens、共享框及profile响应式；不按页面覆盖header/footer |
| `src/lib/theme.ts` / `__root.tsx` | 同步新theme-color、bootstrap；保留原三态主题与shawn-theme |
| `src/components/ThemeSelect.tsx` | 仅必要的场景冻结适配；storage/快速连切协议不退化 |
| `src/components/shark/SharkScene.tsx` / `.shark-fallback` | 首页卸载旧场景；不需要删除历史实现与许可。如过渡期继续使用，仍需S1阅读保护 |
| `design/homepage-layout.md` / `docs/architecture.md` | 审查通过后标注本次替代条款，修正旧首页场景描述 |

保持不改：文章正文/slug/原PNG、构建期Markdown/Pele及导出语义、Manta实验逻辑、字体许可、依赖框架、生成路由树。`posts/$slug`仅必要布局例外，不重写内容渲染。

实施顺序：核对主分支差异 → tokens与共享路由框/真实文案 → 两尺寸静态核对 → Undertow及S1/S2 → 主题/路由/部署回归 → 补实站截图对照。没有参考截图时实现仍须标“依据源码、视觉待核”，不得用自己渲染的页面作为参考证据。

## 10. 内容不足的处理

- 一个项目就一项，两篇文章就两项；不从对方portfolio搬经历或贡献密度。
- 没头像就没有头像，没有封面就开放文字条目；文章PNG只用于原文章。
- 简历保留整理中，GitHub是现有联系入口；不猜邮箱/所在地/接单状态。
- Python/TS/FluxCD属于context背景，默认不新增公开区块；可帮助设计判断，不能充当本轮用户提供的可发布文案来源。
- 未来无文章时显示“文章整理中”及项目/GitHub入口；不展示伪列表。当前两文正常显示。

## 11. 可执行验收清单（目标，不是本轮测试成绩）

### 参考证据与画面

- R1：两站桌面/移动首屏和全页截图、主题/URL/DPR/时间齐备；**当前未完成**。
- R2：Empryo同视口时间采样和连续观察记录；**当前未完成**；不得把源码时钟估算当实测。
- R3：源码证据可独立复核：O1的420/900/980与250/280、gap64/96；E1的Undertow浅深palette；E3/E4的导入链与潮线/泡沫分支。已提供必要摘录和hash。
- V1：1440×900、1024×768、768×1024、390×844、320×568，两主题及200%文字放大；无遮挡、裁切、页面横溢出；文章内部代码/table允许自身横滚。
- V2：首页左身份/右内容，大屏右604px；手机身份在上；姓名/影视后期出发原文、三入口未丢。五导航是可刷新的真实路由，无空tab。
- V3：项目1、文章2、简历整理中；未发布context简介、假经历、热图或成果。
- V4：新palette对应E1，不残留旧暖灰默认；动态/静态/Canvas失败/JS禁用均检查实际合成对比。
- V5：背景能识别潮汐涨落、泡沫与岸面，不出现ASCII鱼或随机发光粒子；.34calm及阅读mask生效。此项由运行截图/录像判，不仅看shader代码。

### 动画与故障

- A1：隐藏页/非首页/reduced-motion无连续RAF或计时器；恢复不追帧、不跳相位。
- A2：分别在正常档、降质但仍动画档、用户暂停、强制静态四种状态执行去/posts→回首页→后退/前进→切主题→resize；验证状态表、按钮和真实绘制一致。低档仍须能暂停/继续；恢复后只有一个循环。
- A3：强制WebGL初始化失败、context lost、Canvas不可用、mask未ready、降级静帧，均可读；纯底色为有效安全回退。
- A4：记录实际设备/视口/质量档、CPU p95、帧间隔及可得GPU数据；旧6/4ms预算和15/12fps目标不是测得成绩，超预算实际降级。
- A5：单独测实际首页renderer/组件生命周期；Manta测试结果不得替代。截图、运行时绘制计数和针对真实调度接口的测试共同取证。
- A6：SSR/无JS立即有介绍、项目、文章链接；无hydration warning；强制色模式保持焦点。

### 主题状态回归矩阵

| 场景 | 必须保持的行为 |
|---|---|
| 冷启动、刷新、SSR→hydration | head bootstrap 在首绘前应用合法保存值；无保存值时跟随系统；select 与实际主题一致，无白闪 |
| 浅色 / 深色 / 跟随系统 | 三选项均可用，保持 `shawn-theme`；跟随系统时 OS 变化生效，手动浅/深色时 OS 变化不覆盖用户选择 |
| localStorage 禁用或读取异常 | 页面不报错，本次访问可切换；刷新恢复安全默认，不依赖持久化成功才能更新 |
| 第二标签页更新或清除 theme key | 当前页接收 storage 同步，select、根主题、theme-color、背景/静帧一致；清除按 system；同步不播放揭示、不恢复用户暂停 |
| 280ms 内快速连续选择三次 | 最终等于最后意图；旧 ready/finished 回调不得回写；并行揭示 0，不排队，场景冻结能解除但不突破暂停/系统限制 |
| 同一解析主题、OS 更新、storage 同步、初次 hydration | 直接应用，不播放圆形揭示 |
| View Transition 不支持、抛错或快照失败 | 直接应用最后目标，无白色遮罩、悬空冻结或不可用控件 |
| reduced-motion 初始或运行时开启 | 静态背景、无揭示；主题仍能直接切换；用户“继续”不可覆盖系统限制 |

主题矩阵需在根部署和 `/shawndeng_blogs/` 静态预览至少各走一次核心流程；跨标签与快速切换必须用真实浏览器交互验证，不以配色 PNG 代替。


### 内容、SEO和部署

- E1：`npm run test:content`、`npm run typecheck`、`npm run build`；分别根路径与`SITE_BASE_PATH=/shawndeng_blogs/`构建，用静态preview直接刷新路由，不能只验dev SPA回退。
- E2：所有公开路由、原Markdown/GFM表格/代码/PNG、未知slug/404正常；Linux验证大小写旧地址和.html跳转，macOS结果不能替代。
- E3：canonical、description、OG title/description/url/image、og.svg、feed.xml、sitemap.xml和真实部署前缀正确；lab noindex且不入sitemap。
- E4：共享样式改动时保留并跑`test:ocean`，只作为Manta回归证据。新tokens或Pele映射影响SVG时，运行`test-pele.mjs`，并用不发布的SVG夹具作视觉验收：通过现有构建期Pele管线生成含中文/英文节点、连线箭头及较长标签的代表图，在浅/深主题、320/760px容器宽度四种组合中检查文字/连线对比、裁切、背景与缩放/内部横滚。夹具放测试或临时预览目录，禁止进入content/posts、RSS、sitemap与生产路由；不改现有文章来演示，不引入浏览器Mermaid。程序测试通过不能替代这四组浏览器核验。

## 12. Coco二审重点与取舍

| 项目 | 当前决定 / 审查重点 |
|---|---|
| 实站视觉证据 | 仍未取得；可审具体源码实施稿，但不能宣称完成截图/动画观察要求 |
| Om结构忠实度 | 必须左身份/右路由内容、420/900/980与250/280/gap64/96；旧176px分节侧栏方案已废弃 |
| routes而非tabs | 明确采用五个既有真实URL；保留可刷新/SEO/静态部署，舍弃对方隐藏panel与多余栏目 |
| 个人身份 | 以邓辉/Shawn及影视后期出发原文为主；context的Python/TS不可冒充用户本轮原话 |
| 颜色与背景 | Undertow源码palette与低强度海岸算法已明确；不再保留暖灰“暂定”或把场景形态留空 |
| 首页/文章范围 | 首页有环境场景；概要页共用profile网格；长文760px独立阅读，不带身份栏和动画 |
| 性能架构 | 先原生WebGL2+Canvas2D/main-thread，15/12fps与静态降级；不为复刻参考基础设施强上Worker |
| 安全退化 | S1静帧保护、S2单状态、三态主题矩阵不可删除；强度/帧率可向更保守方向调，不降低可读性 |
| 旧约定覆盖 | 默认共享1120改980是本次明确调整；字体、路由、Pele、lab功能与主题安全继续保留 |

### 针对固定初稿87b25dd的审查处置

- P0参考未落实：本稿以O1/E1–E5真实源码修订为420/900/980框、左身份/右内容、Undertow实值与明确算法；旧880px纵向暖灰方案失效。
- P1身份/内链：第4.2节保留本人原文、两处内链和三入口；现有四张草图同步身份与构图，最终链接由实现验收。
- P1来源：Python→TS/FluxCD明确标Owner Context Bundle；不新增公开文案，未来采用只能先作为编辑建议。
- P1暂停冲突：第7.3节状态表明确降质仍动=可暂停，用户暂停=可继续，强制静态=说明；共享所有者与离开返回规则见S2。
- P2 Pele：E4新增不发布SVG夹具与浅/深×320/760四组合验收；当前没有执行产品视觉测试。
- 证据拆分：R3源码已核实；R1/R2浏览器观感待验收。工具故障不等于站点离线，不增加用户批准门槛。

## 13. 交付与检查状态

- `PLAN.md`：本版完整实施稿，供Coco二审与Cindy使用。
- `evidence/source-findings.md`：必要源码摘录、原URL/日期/hash，不含整站资产；`access-log.md`保留失败历史并补充源码后来可达的事实。
- `desktop-wireframe.svg/png`、`desktop-light-wireframe.svg/png`、`mobile-wireframe.svg/png`、`mobile-light-wireframe.svg/png`：桌面/手机×浅/深四张图稿，统一两栏/上下重排与冷灰蓝色板。**它们是本站静态设计草图，不是参考站截图；背景算法由第7节定义，草图不伪造运动。**
- PNG通过AppKit将本站SVG草图栅格化，使用本地字体回退；不证明浏览器已加载JetBrains Mono/Sarasa。真实字体、断行和200%放大仍需Cindy在浏览器核验。
- 已核对7份原始输入SHA-256、所有配色hex在保存HTML中存在、四份SVG XML/本人姓名/无新增context文案、Markdown本地链接及`git diff --check`；四张PNG已逐张查看，无明显遮挡或裁切。
- 本轮检查仅针对文档、来源、草图与配色公式；产品构建、真实浏览器交互、性能与参考视觉验收都由后续阶段执行，不宣称已通过。
- 未修改产品代码，未建session，未部署或向主会话主动发消息。主会话按既有授权串行安排Coco→Cindy。
