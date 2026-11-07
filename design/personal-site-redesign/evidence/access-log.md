# 参考访问证据记录

记录日期：2026-11-07（Asia/Shanghai）。本记录是工具结果摘要，不是视觉观察报告。

## Chrome 浏览器

已发现可用 Chrome extension 浏览器，研究标签页为本次新建。

1. `cua.createBrowserTab('chrome', 'https://empryo.com/docs', ...)`：报 `Cannot read properties of undefined (reading 'timeoutMs')`。
2. 使用浏览器公开 `tabs.new()` / `tab.goto()` 接口再次打开 Empryo：同样失败。
3. 读取 browser-troubleshooting 文档，检查 tabs 列表：研究页仍为 `about:blank`。
4. 重建 CUA REPL 状态，重新绑定 Chrome，在已有研究页导航至 `https://omavashia.com/`：同样失败；返回 URL 仍是 `about:blank`。
5. 尝试 1440×900 视口与 screenshot：同样接口错误，未获得图像。
6. 已重置临时 viewport。没有把空白标签截图充作参考站证据。

结论：当前浏览器控制链路无法完成网页导航/截图。移动观察和动画观察没有可用证据；这不是“两站没有动画”，也不是“两站离线”。

## Coco 补充后的复核

主会话提示 Chrome id=1 可用后，本会话再次用 `cua.createBrowserTab('chrome', 'https://omavashia.com/', {sessionName:'🎨 Reference'})` 尝试，返回 `Browser is not available: chrome`。随后 `cua.getState()` 返回 `apps: []`、`browsers: []`。这记录的是本会话当时的可用性，不否定主会话能看到 Chrome；没有取得新截图或实站观察。

## 网页文本工具

- `https://empryo.com/docs`：成功，取得文档文本。只用于确认地址及文本可达，不用于推断视觉。
- `https://omavashia.com/`：Internal Error，URL not accessible via this tool。

## 终端 HTTP

对两个原始 HTTPS 地址各一次 `curl -L --max-time 25`，均返回 `curl: (6) Could not resolve host`。未做无限重试，没有访问猜测域名，没有绕过安全提示。

## 后续需要补齐的证据

详见 `../PLAN.md` 第 2.3 节。两站各两尺寸的真实截图和 Empryo 动画采样齐备前，现版 R1/R2 不能标为通过。

## 后续源码获取成功（不覆盖上述失败历史）

2026-11-07，主会话通过受审网络权限以 curl 成功取得两站完整HTML及所需公开CSS/JS，并提供本地路径。Cody已读取、交叉核对并保存必要摘录、原URL、日期与SHA-256到 `source-findings.md`。因此“Om内容不可知”“配色/布局/场景机制未定”已不再成立；现版方案以源码明确这些事项。

成功取得的是公共响应源码，**不是浏览器截图**。该事实没有解除浏览器控制故障，也不能将源码中的动效时钟、主题默认值和断点当成实际观察画面。旧终端DNS失败与后续受审curl成功属于不同权限条件下的记录，不应混写成网站始终不可访问。
