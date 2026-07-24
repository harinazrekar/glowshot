# Known issues / deferred work

Tracked issues that are deliberately not fixed yet, with the reason and the trigger for fixing them. Keep this current — an undocumented deferral reads as an oversight.

## Deferred

### SEC-02 — High-severity advisories in transitive build dependencies
- **What:** `npm audit` reports 3 high-severity advisories, all in build/SSR-only transitive deps of Next.js:
  - `sharp` `<0.35.0` → inherited libvips CVEs (GHSA-f88m-g3jw-g9cj)
  - `postcss` (via `next`) → arbitrary file read via `sourceMappingURL` (GHSA-6g55-p6wh-862q)
- **Real-world impact:** Low. Glowshot is a 100% client-side static app — `sharp` (Next's image optimizer) and `postcss` (build-time) never run in the user's browser or on a request path. No user-facing exposure.
- **Why deferred:** The only fix `npm audit` offers is `npm audit fix --force`, which **downgrades Next.js to 9.3.3** — a massive breaking change. Not worth it for a build-time-only issue.
- **Do NOT:** run `npm audit fix --force`.
- **Trigger to fix:** the next planned Next.js upgrade. Bump Next (which pulls patched `sharp`/`postcss`), then confirm `npm audit --omit=dev` is clean and `npm run build` still passes.
- **Logged:** 2026-07-24, during the post-launch correctness/security audit.

### Selection chrome renders into exports (candidate — verify before fixing)
- **What:** `AnnotationLayer` (including `SelectionHandles`) lives inside the export node (`#glow-canvas`). If an annotation is selected at export time, its selection outline/handles may be captured in the PNG/SVG/clipboard image.
- **Status:** Noticed during the audit; not yet reproduced end-to-end. Affects all annotation types equally (not introduced by the UX-01 text-outline change).
- **Fix approach (when confirmed):** clear `selectedId` (and let React flush) immediately before capture in the three export entry points (`handleDownload`, `handleCopy` in `Editor.tsx`, and the "Copy as data URI" handler in `Sidebar.tsx`), or render selection chrome in a sibling layer outside `#glow-canvas`.
- **Logged:** 2026-07-24.
