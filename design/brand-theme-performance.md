# Brand and theme performance

## Changes

The original homepage discovers the 26,488-byte Allura WOFF2 through CSS and may display a fallback before it arrives. The fixed `Shawn Deng` signature now uses a 2,596-byte subset embedded in the homepage HTML. A short inline script starts decoding it while the document parses; `font-display: swap` retains visible, selectable text. The full Allura face remains a fallback for other characters. If JavaScript is unavailable or decoding is delayed, a visible swap remains possible.

The subset was generated with fonttools 4.60.0 and `--text='Shawn Deng' --flavor=woff2`; regenerate it if the signature changes. The original OFL license remains at `public/fonts/allura/OFL.txt`. No network font preload is added.

The theme reveal follows the [current public reference chunk](https://omavashia.com/_next/static/chunks/5135-218619057b9531ec.js), checked on 2026-11-20: 48 px tiles appear according to `(.75 * normalized distance + .25 * random) * 700 ms`, with the old snapshot retained for 750 ms. The new snapshot, including text, is revealed locally in both directions. A single generated SVG mask groups tiles by 60 Hz time slots into at most 43 static paths with discrete SVG animations. Timing is quantized by at most one frame and edge cells are capped at 700 ms; this avoids rebuilding a growing path every frame and avoids one animation node per tile. The mask is removed on completion, interruption, resize, storage/system changes, or unmount. Reduced motion, unsupported APIs, and viewports above 3,000 cells switch immediately. SVG image animation support and performance should still be checked in target browsers; `CSS.supports` cannot prove that SVG animation plays. During each theme update a temporary rule disables CSS transitions on elements and pseudo-elements, forces style resolution, and is removed on the next animation frame; pending suppression is cleaned up on unmount. This prevents theme-dependent colors from continuing to interpolate inside the new snapshot.

## Local evidence and limits

These are local Chrome lab observations, not online Core Web Vitals. The independent baseline (`/private/tmp/brand-theme-before-review.json`) used 390×844 cold loads, 4× CPU slowdown, 1.6 Mbps and 150 ms latency: LCP 996 / 720 / 772 ms, CLS 0, and a fallback-to-Allura width change 238–298 ms after the first heading sample. Each load requested the 26,488-byte font.

The reviewer independently rebuilt the final HTML-inline face plus early `document.fonts.load` from a frozen source copy. Three cold loads recorded LCP 912 / 736 / 724 ms, CLS zero, and first heading width 205.1875 px with no subsequent width change. The signature face was already loaded and there were no Allura network requests. A foreground Chrome screencast was inspected: the first content frame already showed the Allura signature. Evidence: `/private/tmp/brand-theme-accepted-review.json` and `/private/tmp/brand-theme-font-film-reviewer-final/`. These measurements do not establish a universal timing guarantee or an LCP gain.

Inlining the subset in CSS alone, or in HTML without early decoding, still produced sampled width changes after 66–128 ms. Those were intermediate experiments, before the final early-decode implementation. No separate font request alone proves that a visible swap was eliminated. A prior experiment using a network font preload increased median LCP and was not reintroduced.

An isolated local headless Chrome sample of the grouped-mask implementation, at 4× CPU slowdown, recorded three switches at 390×844 and 1920×1080. Frame-interval p95 was 16.7–16.8 ms in all six samples; worst intervals were 66.6–116.7 ms on mobile and 66.7–99.9 ms on desktop. A 68 ms long task appeared on the first mobile switch; no other long tasks were observed. This is a small lab sample, not a smoothness guarantee or a direct comparison with the reference. The first prototype with one SVG animation per tile recorded 138–153 ms desktop long tasks in the same local setup; grouping reduced SVG animation nodes to at most 43. Real-device and cross-browser profiling remain necessary.

## Verification

- Root and `SITE_BASE_PATH=/shawndeng_blogs/` production builds passed, including TypeScript and static checks. The final frozen builds are `/private/tmp/reference-theme-accepted-root` and `/private/tmp/reference-theme-accepted-subpath`; both include the existing inline WOFF2 and early decode script. The earlier `/private/tmp/brand-theme-frozen-root-build` is a historical baseline.
- `npm run test:theme` verifies 48 px grid coverage, distance ordering, and random scatter within the quantized timing. Local Chrome acceptance covered normal and interrupted toggles, seven immediate clicks, resize, storage overrides and exceptions, system/reset, reduced motion, unsupported API/mask and animation failure; completed states had zero animations and no runtime errors. At 320/390/768/1440 px there was no horizontal overflow and the heading and 369 calendar cells remained. Results: `/private/tmp/brand-theme-cindy-final-acceptance.json`; the main session independently repeated acceptance on the final build, including transition-start/ready failures, style cleanup and the >3,000-cell fallback, on both root and GitHub Pages subpath builds. Evidence: `/private/tmp/reference-theme-accepted-functional.log`, `/private/tmp/reference-theme-accepted-extra.log` and `/private/tmp/reference-theme-accepted-subpath.log`. Intermediate Chrome screenshots showed scattered tiles and local text reveal (`/private/tmp/theme-b.png`).
- The main session ran `impeccable detect` on all three changed UI files after the route-level font change; it returned `[]`. This is a source scan, not a page-level accessibility audit. `git diff --check` passed.

- A local Chrome regression injected three-second color and background transitions on a probe and its `::before` pseudo-element. Both directions reached their final theme colors during the reveal, no CSS transition remained active, and the original transition durations returned after the temporary rule was removed. Test script: `/private/tmp/theme-colors.mjs`.

- In an isolated Chrome build, deterministic random seeds were used at 390×844 and 1440×900 with both normal updates and an artificial 500 ms delay before the update callback. Captures 100/300/520 ms after `ready` showed the reveal still progressing after the delayed `ready`, with mixed old/new text colors within the 48 px grid. The temporary `[data-theme-reveal]` style and animations were absent at completion. Evidence: `/private/tmp/theme-ready-{390,1440}-{0,500}-{100,300,520}.png` and `/private/tmp/theme-ready-test.mjs`. This establishes the behavior observed in Chrome, not identical timing in every browser.

## Independent final comparison (2026-11-20)

The main session loaded the real reference in Chrome and inspected its intermediate frames at 390 and 1440 px. It then inspected this site's intermediate frames in both directions, including the locally revealed text. This restores the scattered grid effect that the previous contiguous 28-point outline had changed. The SVG image's animation clock starts when the browser uses the mask, near the new snapshot's first paint; its exact start is not explicitly synchronized to `transition.ready`. Nominal timing matches the reference within the documented frame quantization, rather than promising identical frames or random layouts.

To compare equivalent effects, a temporary browser harness ran the reference's distance/random timing and per-frame growing clip-path on the **same final local page**, with the same 48 px cells and 750 ms snapshot hold. This is a same-page algorithm comparison, not a performance test of the remote reference site. Five warmed switches per viewport ran sequentially in local headless Chrome at 4× CPU slowdown. Task time covers the full one-second observation window.

| Viewport | Reference algorithm task median | Final mask task median | Reduction | Final script median |
| --- | ---: | ---: | ---: | ---: |
| 390 × 844 | 364.81 ms | 252.81 ms | 30.7% | 9.64 ms |
| 1440 × 900 | 416.98 ms | 300.41 ms | 28.0% | 14.48 ms |
| 1920 × 1080 | 413.29 ms | 253.71 ms | 38.6% | 11.21 ms |

Final frame-interval p95 medians were 16.7 / 16.8 / 16.8 ms. One desktop sample had p95 33.3 ms; two desktop switches recorded 67 / 93 ms long tasks. Worst sampled frame intervals across the final runs reached 183.3 ms, so startup stalls have not been eliminated. These observations support lower work for the matching effect, not a universal 60 fps claim. The incorrect contiguous-outline baseline was cheaper (task medians 150.70 / 147.09 / 142.98 ms) and shorter (560 ms); its performance is not evidence of visual equivalence.

Raw measurements: `/private/tmp/brand-theme-reference-algorithm-review.json`, `/private/tmp/brand-theme-accepted-final-review.json`, and `/private/tmp/brand-theme-restored-baseline-review.json`. Harness: `/private/tmp/reference-theme-oracle-performance.mjs`. The main session also passed `npm run test:theme`, root/subpath production builds (including TypeScript/static validation), `git diff --check`, and the focused taste source scan (0 failures). Existing page-wide style findings outside these changed files were left in scope for their own work.

## Fractional-scale mask seams (2026-11-20)

A user screenshot exposed faint grid lines during the reveal. The prior checks missed fractional device pixel ratios. Reproduction with classic scrollbars found antialiased gaps between separately rasterized adjacent mask paths: a blank 140 CSS px strip contained 10,016 / 14,794 / 11,404 incorrect-color pixels at DPR 1.1 / 1.25 / 1.3. A fixed mask size or `crispEdges` alone did not eliminate the defect.

The mask now uses 49 px coverage on the unchanged 48 px grid, overlapping neighboring cells by 1 CSS px, with crisp SVG edges and explicit viewport-sized mask dimensions. The number of paths, discrete timing and 750 ms snapshot hold are unchanged. This slightly extends a tile's coverage into its neighbor to prevent the old snapshot bleeding through shared edges.

The timing comparison above preceded this overlap adjustment. The seam fix was verified for visual correctness and interaction cleanup; its performance was not separately remeasured.

The actual production SVG animation was sampled before transition cleanup, after all groups had revealed. Only the snapshot-hold animation was prolonged to 1500 ms for sampling; the SVG and its reveal timing were unmodified. Across DPR 1 / 1.1 / 1.25 / 1.3 / 1.5 / 2, in both directions, the interior blank strip had zero incorrect-color pixels. Temporary mask/suppression styles and animations were cleared afterward. Evidence: `/private/tmp/theme-seams-production.json`, `/private/tmp/theme-seams-production.mjs`, and matching PNGs. Root build, `npm run test:theme`, focused source lint and `git diff --check` passed.
