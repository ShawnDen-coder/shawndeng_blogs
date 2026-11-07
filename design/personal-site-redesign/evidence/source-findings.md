# 参考站源码证据摘录

核对日期：2026-11-07（Asia/Shanghai）。主会话经受审网络权限用 curl 获取公开 HTML/CSS/JS，Cody 读取本地文件并核对以下内容。**这是响应源码证据，不是截图、浏览器 computed style 或运动实测。** 本目录只留必要属性、数值与机制摘要，不复制整站资产、压缩包或 shader 实现。

## 来源与内容指纹

URL 对应本次具体版本；以后同一 URL 返回内容可能变化。SHA-256 是所读取完整文件的校验值，不是本站新实现的 hash。

| 原 URL | SHA-256 |
|---|---|
| https://omavashia.com/ | `7f6fd73de3c2bb6b0dc0fbea7088888c17bdfcc0f238acf4d8c189e164c5d354` |
| https://omavashia.com/_next/static/css/e5675bfaf62779ac.css | `0dc4aadb65fb849bc908af07981438a7ac54c617f3a7c744b1bc6d97e3254fc9` |
| https://empryo.com/docs | `5934a31f37716065078f78b28f13861d360f7699e95e966f3eb0535043f294f7` |
| https://empryo.com/assets/index-CwzOISm9.js | `922d2955216f9183dc41b75f0a7dd6c665b0b6704af67ad7e92e4d5e1beaae38` |
| https://empryo.com/assets/boot-D15cGb00.js | `519e2e90abb743f26c6dbd38248c25fd29099ac54670fef35a030a0c21e5b1b2` |
| https://empryo.com/assets/main-thread-C81qjmBt.js | `140d5f0d4cd99e62b0100e88bf252cfc9d3734909eba5f4e9ad421abac80410a` |
| https://empryo.com/assets/worker-BP43TESw.js | `dc3391d6e25e77d7b3f77b859a3e051cf5cfccc54135f25dbfd19db531a1e98a` |

## O1：Omavashia 的结构与断点

来源：上表 Om HTML 和 CSS；检索 class/role 即可定位。

必要 SSR 属性摘录：

```text
w-full max-w-[420px] md:max-w-[900px] lg:max-w-[980px]
flex flex-col md:flex-row md:gap-16 lg:gap-24 md:items-start
md:w-[250px] lg:w-[280px] md:shrink-0 flex flex-col
flex flex-row-reverse ... md:flex-col ... gap-5
flex-1 min-w-0 grid
role="tablist" / role="tabpanel" / data-active="true"
```

CSS 证实 md 为 min-width:48rem，lg 为64rem；常规16px根字号对应768/1024px。间距基数4px，gap-16=64px、gap-24=96px。页外 padding：小屏24px，md48px，lg80px。移动资料内层是反向横排（照片与文本），md起纵排；整个身份/内容组在小屏是纵向、md起横向。

顶部顺序：home、projects、open source、experience、writing、videos、reading。前述并非全部同类交互：SSR 可见部分是 role=tab 的按钮，writing 等还有链接。右内容区将 panel 置于同一 grid area；非活动 panel visibility:hidden、height:0、overflow:hidden；活动 panel 恢复显示。源码有0.18s opacity /0.22s transform转换，**没有实际点击验证**。

本站映射：顶层仅保留首页/项目/文章/关于/简历五个真实路由；左身份、右路由内容。不复制缺少资料的开源/经历/视频/阅读页，不复制头像、个人成果和贡献热图。

## E1：Empryo 根状态和 Undertow 色板

boot 中的必要场景声明：`habitat: The beach`；`tagline: An overcast shore: cold surf, white foam and wet black rock.`。据此可确认阴天海岸、冷浪、白泡沫与湿黑岩面的设计意图，不等于实际屏幕采样或运动观察。

响应 HTML 根属性摘录：`data-world="undertow" data-theme="dark"`。bootstrap 可能按本地偏好/查询参数/系统状态改变它，故只能称“响应默认状态”，不能称“浏览器最终看到深色”。

来自 HTML `data-critical-css="/assets/living-C3beEkU4.css"` 的 Undertow 规则；boot JS palette 对照相同：

| 变量 | light | dark |
|---|---|---|
| `paper` | `#f4f6f8` | `#0c0e11` |
| `paper-raised` | `#fbfcfd` | `#1a1f26` |
| `paper-sunken` | `#e9edf1` | `#08090c` |
| `ink` | `#1a2028` | `#e8ebee` |
| `ink-soft` | `#4a5560` | `#adb5bf` |
| `ink-faint` | `#67727d` | `#838c97` |
| `rule` | `#cdd5dc` | `#2a323c` |
| `pigment` | `#4a6a80` | `#98b0c2` |
| `pigment-alt` | `#914d5e` | `#c49aa4` |
| `pigment-deep` | `#dde5ec` | `#1c242c` |
| `on-pigment` | `#fbfcfd` | `#0c0e11` |
| `nucleus` | `#914d5e` | `#e0a9b6` |
| `ok` | `#376f57` | `#93b3a2` |
| `warn` | `#7e6032` | `#cfb595` |
| `bad` | `#a8484a` | `#d68f8f` |
| `info` | `#43667f` | `#8fadc4` |

## E2：docs 强度与场景 CSS

HTML：`class="lv-page dc" data-intensity="calm"`。
CSS 必要值：`.lv-scenery` fixed/inset:0/pointer-events:none；ready canvas opacity默认为.85，ambient为.6，calm为.34；`data-motion=still` 关闭 transition/transform。普通首入的 opacity 1.6s、transform 2.4s 仅为源码参数，本站不沿用长入场。

## E3：导入路径与运行分支

HTML entry `/assets/index-CwzOISm9.js` → 导入 boot 的场景创建导出（压缩名 `t`）；boot 创建 `.lv-scenery`/canvas → 支持 Worker + OffscreenCanvas + transferControlToOffscreen 时加载 `/assets/worker-BP43TESw.js`；能力条件不满足时才进入else动态 import `./main-thread-C81qjmBt.js`。Worker的`onerror`仅调用错误报告，当前摘录未证明启动失败后会自动进入该else分支；不得将能力备用路径称为运行失败自动恢复。main-thread 同时 import boot palettes 和 router 中的 seed/random helpers。worker 内也能定位 Undertow 工厂及同一色板。

boot 将 world/mode/still/seed/scroll 传给 engine；visibilitychange与IntersectionObserver控制 visible；字体ready、resize、DOM变化后重建文字保护图。此处确认的是分支代码存在，不证明本设备实际走了哪个分支。

## E4：Undertow 算法（源码分析，不是亲眼运动观察）

main-thread 中 `Oe` 的 `undertow:we` 注册对应场景工厂。

- 优先尝试原生 WebGL2；片元 shader 使用5层FBM噪声、基于邻近两个特征点距离差的 lace、大小两级泡沫、潮线/湿沙/细纹，非ASCII鱼、普通点阵或随机渐变光团。
- 必要公式摘录：`phase = fract(t * 0.026)`；`edge = 0.6 - reach * 0.24 + wiggle`；`still` 的固定内部时间常量为31。
- reach由phase的0→0.35上升及0.35→1回落组成；潮线加两种空间频率噪声。下方水面与岸面混合；泡沫用26与58的纹理频率；grain/ripple提供颗粒与细纹，最后与paper混色。
- 深色shader内部材质是 deep #0d0e0f / mid #2b2e30 / foam #e4e6e7 / rock #0a0a0b。浅色 deep来自pigment与ink混合，mid来自pigment与paper混合，foam #ffffff，rock来自paper-sunken与pigment混合。不要用主题accent替代全部内部材质。
- WebGL渲染比例 high .55 / medium .45 / low .35，宽度上限1700；Canvas2D备用缓存 high880×550 / medium700×440 / low480×300，竖屏交换长短边。
- 2D备用以noise生成base与foam/swell两张低分辨率缓存，base微移，两个半周期错开的swell以sin²透明度叠加；不是每帧重算所有像素。
- 场景时间推进为 dt×(.7+energy×.3)，calm energy=.36，故内时速率.808；按.026相位推算一轮约47.6秒墙钟（未计暂停、dt截断等），**不是实测周期**。2D备用的.075循环与GL分支不同，不混为同一周期。
- 滚动随scrollY/(1.4×viewportHeight)将强度从1衰减至.45；splash/cue在该工厂是空方法，不应凭全局splash入口断言Undertow有点击涟漪。

## E5：阅读保护与运行预算

boot 的shade map按16px单元采样，文字/媒体/控件边界扩28px，横纵各7点平滑。engine先绘制live再以destination-out剪掉阅读区域，calm强度的擦除系数=.985（最大残留1.5%）。docs因此不等于将完整高对比海浪直接叠在文字下面。

引擎 intensity 的调度目标对应full约30、ambient约24、calm约15fps；真正帧率受计时器与RAF影响，未实测。WebGL调用的JS耗时只表示CPU提交成本，不能单独证明GPU整帧预算；本站必须另做帧间隔/GPU可用指标与实际浏览器观感验收。旧本站30/20fps预算不能称参考站实测值。参考实现有慢帧降质与长时间快帧升质；本站为避免振荡，推荐单会话只降不升。

## 证据边界

上述数字来自保存响应和资产源码的直接读取；动画外观、泡沫视觉密度、移动端实际裁切、浏览器最终主题、输入交互与性能均未实际截图验证。实际观感、自然运动、合成对比、响应式与性能留待实现后浏览器验收；远端截图不是此次设计二审的前置门槛。后续实现原创编写，不直接复制这些压缩bundle/完整shader，公共可读不代表素材与代码可任意再分发。
