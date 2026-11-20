# Homepage performance

## Scope

Keep the existing layout, content, typography and routes. Improve the contribution calendar interaction and remove unnecessary homepage font discovery requests; retain server-rendered content and existing accessibility semantics.

## Production baseline

The main session measured the unmodified production build at 1.6 Mbps, 150 ms latency and 4× CPU slowdown (`/private/tmp/homepage-before-metrics.json`). Three runs produced LCP 772/740/720 ms (median 740 ms) and CLS 0. A sweep across 30 calendar cells recorded 222.6/205.8/205.7 ms of script time (median 205.8 ms). These are local measurements, not field data.

All three runs requested two JetBrains Mono CSS files on the homepage and discovered the 26,488-byte Allura font via CSS. No Sarasa font appeared in these recorded requests; its on-disk size alone does not justify subsetting it.

## Changes

- `ContributionCalendar` keeps the existing grid, buttons, labels and keyboard navigation. A memoized grid and delegated events isolate its 369 day buttons from selection updates. Roving tab focus is maintained without rendering every button on each focus change.
- Remove the two JetBrains stylesheet links from the root document. The article route provides both stylesheets; the manta lab retains the regular face used by its canvas renderer. Their Vite-generated URLs respect the build base.
- Allura remains discovered through the existing CSS. A homepage-only preload was tested and removed after the local LCP regression described below.
- No font subset, layout, copy or theme changes were made.

## Verification

- `npm run typecheck` and `npm run build` passed. Builds passed for both the root path and `SITE_BASE_PATH=/shawndeng_blogs/`; prerendering requires permission for a local listener. Static validation covered seven pages, redirects, RSS and sitemap.
- `git diff --check` passed. Static HTML inspection found no JetBrains CSS links on the homepage, both JetBrains links on an article, and the regular link on the manta lab.
- The main session verified no horizontal page overflow at widths of 320, 390 and 1440 pixels; all 369 calendar buttons; arrow, Home and End keys, boundaries and a single tab stop; and hover, click and blur behavior.
- Three consecutive theme switches and reduced-motion behavior passed. Real SPA navigation from About through Writing to an article retained both code font stylesheets. No runtime errors were observed. Visible SSR body text matched before and after, and `impeccable detect` returned `[]`.

## Final local measurement

The main session measured the final root-path production build without preload under the same simulated conditions (`/private/tmp/homepage-final-metrics.json`). These are local lab measurements, not online Core Web Vitals.

| Metric | Baseline median | Final runs | Final median |
| --- | ---: | --- | ---: |
| LCP | 740 ms | 756 / 708 / 712 ms | 712 ms |
| CLS | 0 | 0 / 0 / 0 | 0 |
| 30-cell sweep script time | 205.832 ms | 100.827 / 91.499 / 94.411 ms | 94.411 ms |
| 30-cell sweep task time | 799.330 ms | 716.004 / 667.681 / 691.481 ms | 691.481 ms |

The median sweep script time fell 54.1% and task time fell 13.5%. The LCP difference is small and should not be treated as evidence of a large loading improvement. Excluding favicon, homepage resource requests fell from seven to five by removing two blocking stylesheets; gzip-compressed subresources fell only from 150,312 to 150,113 bytes. Initial hydration still produced a long task of approximately 137–139 ms, so blocking work has not been eliminated.

## Preload experiment

With Allura preloaded, the main session's matching local run (`/private/tmp/homepage-after-metrics.json`) recorded LCP 796/792/796 ms (median 796 ms), CLS 0, and calendar sweep script time 229.0/94.8/98.9 ms (median 98.9 ms). Font completion moved earlier, but LCP increased by 56 ms at the median compared with baseline, so the preload was removed. These results describe the experimental build, not the final build.
