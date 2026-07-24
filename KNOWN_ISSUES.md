# Known issues / deferred work

Tracked issues, with the reason and the trigger for fixing them. Keep this current — an undocumented deferral reads as an oversight.

## Open

_None._

## Resolved

### SEC-02 — High-severity advisories in transitive build dependencies (fixed 2026-07-24)
- **Was:** `npm audit` reported 3 high-severity advisories in Next.js's transitive deps — `sharp` `<0.35.0` (libvips CVEs) and `postcss` `<=8.5.11` (XSS via unescaped `</style>`, arbitrary file read via `sourceMappingURL`).
- **Key finding:** Next 16.2.11 is already the latest release and *still* bundles both vulnerable versions, so there was no forward Next bump to wait for — the original "defer to next upgrade" plan was based on a wrong premise.
- **Fix:** `overrides` in `package.json` force `postcss@^8.5.22` and `sharp@^0.35.3`. `postcss` 8.x is API-stable (safe for Tailwind's build-time processing); `sharp` is only used by `next/image`, which this app doesn't use (the canvas renders a plain `<img>`), so the bump is inert at build time. `npm audit` now reports **0 vulnerabilities**; `npm run build` still passes.
- **On the next Next.js upgrade:** re-check whether the overrides are still needed and drop them if Next has caught up.

### Selection chrome baked into exports (fixed 2026-07-24)
- **Was:** `AnnotationLayer` (incl. `SelectionHandles`) lives inside the export node (`#glow-canvas`), so exporting with an annotation selected could capture its selection handles/outline into the PNG/SVG/clipboard image.
- **Fix:** selection-only chrome is tagged `glow-no-export`, and every capture path in `export.ts` passes html-to-image's `filter` option to drop those nodes at capture time. Selection is untouched (better UX than deselect-before-export), and the exclusion covers PNG/JPEG/SVG/copy/data-URI uniformly.
- **Verification note:** confirmed by code trace + green build/types/lint/tests; not yet pixel-verified in a live browser export.
