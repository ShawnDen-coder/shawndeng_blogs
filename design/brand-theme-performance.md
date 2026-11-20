# Brand and theme performance

## Changes

The original homepage discovers the 26,488-byte Allura WOFF2 through CSS and may display a fallback before it arrives. The fixed `Shawn Deng` signature now uses a 2,596-byte subset embedded in the homepage HTML. A short inline script starts decoding it while the document parses; `font-display: swap` retains visible, selectable text. The full Allura face remains a fallback for other characters. If JavaScript is unavailable or decoding is delayed, a visible swap remains possible.

The subset was generated with fonttools 4.60.0 and `--text='Shawn Deng' --flavor=woff2`; regenerate it if the signature changes. The original OFL license remains at `public/fonts/allura/OFL.txt`. No network font preload is added.

The original theme reveal builds 21 increasingly complex paths of up to approximately 500 squares. The replacement interpolates a fixed 28-point stepped outline for 560 ms, preserving an outward block-edged reveal while replacing scattered tiles with a contiguous outline. Cancellation is tracked alongside the transition, unmount invalidates pending callbacks, and the finished filled animation is explicitly cancelled.

## Local evidence and limits

These are local Chrome lab observations, not online Core Web Vitals. The independent baseline (`/private/tmp/brand-theme-before-review.json`) used 390×844 cold loads, 4× CPU slowdown, 1.6 Mbps and 150 ms latency: LCP 996 / 720 / 772 ms, CLS 0, and a fallback-to-Allura width change 238–298 ms after the first heading sample. Each load requested the 26,488-byte font.

The reviewer independently rebuilt the final HTML-inline face plus early `document.fonts.load` from a frozen source copy. Three cold loads recorded LCP 912 / 736 / 724 ms, CLS zero, and first heading width 205.1875 px with no subsequent width change. The signature face was already loaded and there were no Allura network requests. A foreground Chrome screencast was inspected: the first content frame already showed the Allura signature. Evidence: `/private/tmp/brand-theme-accepted-review.json` and `/private/tmp/brand-theme-font-film-reviewer-final/`. These measurements do not establish a universal timing guarantee or an LCP gain.

Inlining the subset in CSS alone, or in HTML without early decoding, still produced sampled width changes after 66–128 ms. Those were intermediate experiments, before the final early-decode implementation. No separate font request alone proves that a visible swap was eliminated. A prior experiment using a network font preload increased median LCP and was not reintroduced.

The independent reviewer reported median one-switch task times of 218.45 → 160.49 ms on mobile and 281.38 → 186.24 ms at 1920 px with 4× CPU slowdown. Previous frame-interval samples were mostly around 16.7–16.8 ms p95, so the evidence does not establish sustained low frame rates in the baseline. Each baseline switch left a finished `fill: both` animation; the corrected implementation left zero. Real-device profiling remains useful.

## Verification

- Root and `SITE_BASE_PATH=/shawndeng_blogs/` production builds passed, including TypeScript and static checks. The frozen root build is `/private/tmp/brand-theme-frozen-root-build`; both builds include the inline WOFF2 and early decode script.
- The main session's independent final acceptance passed normal and interrupted toggles, seven immediate clicks, storage overrides and exceptions, system/reset and reduced motion, unsupported API/polygon and animation failure. Every completed state had zero animations and no runtime errors. At 320/390/768/1440 px the page had no horizontal overflow, and the heading and all 369 calendar cells remained present. Screenshots were inspected at all four widths. Results: `/private/tmp/brand-theme-reviewer-final-acceptance.json`. This suite ran on the final font and theme implementation; later source changes were comments only.
- The main session ran `impeccable detect` on all three changed UI files after the route-level font change; it returned `[]`. This is a source scan, not a page-level accessibility audit. `git diff --check` passed.
