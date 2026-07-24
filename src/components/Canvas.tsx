"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toCanvas } from "html-to-image";
import { useEditor } from "@/lib/store";
import { BRAND_GRADIENT } from "@/lib/util";
import { ASPECT_RATIOS, CODE_FONTS, CODE_THEMES, SHADOWS } from "@/lib/presets";
import { WindowFrame } from "./WindowFrame";
import { CodeBlock } from "./CodeBlock";
import { AnnotationLayer } from "./AnnotationLayer";

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  fitScale: number;
  /** Editor stores a "regenerate pixelation raster now" fn here for pre-export use. */
  rasterRefreshRef?: React.MutableRefObject<null | (() => Promise<void>)>;
}

// Subtle film grain (inline SVG turbulence) layered over the background.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Canvas({ canvasRef, fitScale, rasterRefreshRef }: CanvasProps) {
  const s = useEditor();
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState({ w: 0, h: 0 });
  const [baseRaster, setBaseRaster] = useState<HTMLCanvasElement | null>(null);
  const [rasterScale, setRasterScale] = useState(1);

  const hasPixelate = s.annotations.some((a) => a.type === "blur");

  // Rasterize the window (without annotations) so pixelate blocks can sample
  // real pixels. Debounced, and only while a pixelate annotation exists.
  useEffect(() => {
    // No blur annotations → nothing to rasterize. (A stale raster, if any, is
    // simply never rendered since no pixelate block exists.)
    if (!hasPixelate) return;
    const node = frameRef.current;
    if (!node) return;
    let cancelled = false;
    const t = setTimeout(() => {
      toCanvas(node, { pixelRatio: 2, cacheBust: true })
        .then((cnv) => {
          if (cancelled) return;
          setBaseRaster(cnv);
          setRasterScale(cnv.width / Math.max(1, node.offsetWidth));
        })
        .catch(() => {});
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hasPixelate, s.mode, s.imageSrc, s.code, s.codeTheme, s.codeLang, s.codeFontSize, s.frame, s.frameTheme, s.showLineNumbers, s.windowTitle, s.radius, s.borderWidth]);

  // Expose a synchronous "regenerate raster now" for the export path, so
  // pixelation is always up to date at the moment of export.
  useEffect(() => {
    if (!rasterRefreshRef) return;
    rasterRefreshRef.current = async () => {
      const node = frameRef.current;
      if (!node || !hasPixelate) return;
      const cnv = await toCanvas(node, { pixelRatio: 2, cacheBust: true });
      setBaseRaster(cnv);
      setRasterScale(cnv.width / Math.max(1, node.offsetWidth));
      // Let the PixelBlock canvases redraw from the fresh raster before capture.
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r()))
      );
    };
    return () => {
      if (rasterRefreshRef) rasterRefreshRef.current = null;
    };
  }, [hasPixelate, rasterRefreshRef]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setContent({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [s.mode, s.imageSrc, s.code, s.frame, s.frameTheme, s.showLineNumbers, s.windowTitle, s.codeTheme, s.codeFontSize, s.codeFont, s.ligatures, s.wrap, s.radius, s.borderWidth]);

  const ratio = ASPECT_RATIOS.find((r) => r.id === s.aspectRatio)?.ratio ?? null;
  const shadowCss = SHADOWS.find((sh) => sh.id === s.shadow)?.css ?? "none";

  const pad = s.padding;
  const minW = content.w + pad * 2;
  const minH = content.h + pad * 2;

  let canvasW: number | undefined;
  let canvasH: number | undefined;
  if (ratio && content.w > 0) {
    canvasW = Math.max(minW, minH * ratio);
    canvasH = canvasW / ratio;
  }

  const isTransparent = s.background.type === "transparent" && !s.bgImage;
  const bgCss = s.bgImage
    ? `center / cover no-repeat url(${s.bgImage})`
    : isTransparent
    ? "transparent"
    : s.background.css;

  const codeThemeLight = CODE_THEMES.find((t) => t.id === s.codeTheme)?.light;
  const codeBodyBg = codeThemeLight ? "#ffffff" : "#0d0d12";

  const tilt = s.tiltX !== 0 || s.tiltY !== 0;

  return (
    <div
      ref={canvasRef}
      id="glow-canvas"
      style={{
        background: bgCss,
        padding: pad,
        width: canvasW ? `${canvasW}px` : "fit-content",
        height: canvasH ? `${canvasH}px` : "fit-content",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxSizing: "border-box",
        perspective: tilt ? "1400px" : undefined,
      }}
    >
      {/* Noise overlay */}
      {s.noise && !isTransparent && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: NOISE,
            opacity: 0.14,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        ref={contentRef}
        style={{
          position: "relative",
          boxShadow: shadowCss,
          borderRadius: s.radius,
          maxWidth: "100%",
          border: s.borderWidth > 0 ? `${s.borderWidth}px solid ${s.borderColor}` : undefined,
          transform: tilt ? `rotateX(${s.tiltX}deg) rotateY(${s.tiltY}deg)` : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        {/* frameRef wraps only the window so pixelation can sample it without
            capturing the annotations themselves. */}
        <div ref={frameRef} style={{ borderRadius: s.radius }}>
          <WindowFrame
            frame={s.frame}
            theme={s.frameTheme}
            title={s.windowTitle}
            radius={s.radius}
            hideControls={s.hideControls}
            bodyBg={s.mode === "code" ? codeBodyBg : undefined}
          >
            {s.mode === "image" && s.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.imageSrc}
                alt="Uploaded"
                style={{ display: "block", maxWidth: 900, maxHeight: 620, objectFit: "contain" }}
              />
            ) : (
              <div style={{ padding: "20px 22px", background: codeBodyBg, minWidth: 360 }}>
                <CodeBlock
                  code={s.code}
                  lang={s.codeLang}
                  theme={s.codeTheme}
                  showLineNumbers={s.showLineNumbers}
                  fontSize={s.codeFontSize}
                  fontFamily={
                    CODE_FONTS.find((f) => f.id === s.codeFont)?.css ??
                    "var(--font-mono)"
                  }
                  ligatures={s.ligatures}
                  wrap={s.wrap}
                  highlightedLines={s.highlightedLines}
                  dimUnfocused={s.dimUnfocused}
                  diff={s.diff}
                  onToggleLine={s.toggleLine}
                />
              </div>
            )}
          </WindowFrame>
        </div>

        {/* Annotations live inside the export node so they render into the PNG. */}
        <AnnotationLayer fitScale={fitScale} baseRaster={baseRaster} rasterScale={rasterScale} />
      </div>

      {s.watermark && (
        <div
          style={{
            position: "absolute",
            bottom: Math.max(10, pad * 0.28),
            right: Math.max(12, pad * 0.34),
            fontSize: 12,
            fontFamily: "var(--font-sans), sans-serif",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 5,
            letterSpacing: "0.01em",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: BRAND_GRADIENT,
              display: "inline-block",
              boxShadow: "0 0 8px rgba(124,92,255,0.7)",
            }}
          />
          Glowshot
        </div>
      )}
    </div>
  );
}
