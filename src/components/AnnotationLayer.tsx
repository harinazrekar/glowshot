"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditor } from "@/lib/store";
import { uid } from "@/lib/util";
import type { Annotation, Point } from "@/lib/types";

interface Props {
  fitScale: number;
  baseRaster: HTMLCanvasElement | null;
  rasterScale: number;
}

type Corner = "nw" | "ne" | "sw" | "se";
type DragState =
  | { mode: "draw"; id: string }
  | { mode: "move"; id: string; startX: number; startY: number; ox: number; oy: number; origPts?: Point[] }
  | { mode: "resize"; id: string; corner: Corner; anchorX: number; anchorY: number }
  | { mode: "line-end"; id: string; end: "start" | "tip" };

function bboxOfPoints(pts: Point[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Normalized bounds for rect-like annotations. */
function bounds(a: Annotation) {
  return {
    left: Math.min(a.x, a.x + a.w),
    top: Math.min(a.y, a.y + a.h),
    width: Math.abs(a.w),
    height: Math.abs(a.h),
  };
}

/** Diameter of a numbered step badge (x,y are its center). */
function stepDiameter(a: Annotation) {
  return Math.max(26, 18 + a.strokeWidth * 3);
}

export function AnnotationLayer({ fitScale, baseRaster, rasterScale }: Props) {
  const s = useEditor();
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  // Layer rect captured at drag start. The layer never moves/resizes during a
  // drag, so this avoids a forced reflow (getBoundingClientRect) every frame.
  const dragRect = useRef<DOMRect | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const toLocal = (clientX: number, clientY: number) => {
    const rect = dragRect.current ?? layerRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / fitScale, y: (clientY - rect.top) / fitScale };
  };

  const beginDrag = () => {
    dragRect.current = layerRef.current!.getBoundingClientRect();
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const p = toLocal(e.clientX, e.clientY);
      const a = useEditor.getState().annotations.find((x) => x.id === d.id);
      if (!a) return;

      if (d.mode === "draw") {
        if (a.type === "pen") {
          const pts = a.points ?? [];
          const last = pts[pts.length - 1];
          if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 2) {
            const next = [...pts, p];
            const bb = bboxOfPoints(next);
            s.updateAnnotation(d.id, { points: next, x: bb.x, y: bb.y, w: bb.w, h: bb.h });
          }
        } else {
          s.updateAnnotation(d.id, { w: p.x - a.x, h: p.y - a.y });
        }
      } else if (d.mode === "move") {
        const dx = p.x - d.startX, dy = p.y - d.startY;
        if (a.type === "pen" && d.origPts) {
          s.updateAnnotation(d.id, {
            x: d.ox + dx, y: d.oy + dy,
            points: d.origPts.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
          });
        } else {
          s.updateAnnotation(d.id, { x: d.ox + dx, y: d.oy + dy });
        }
      } else if (d.mode === "resize") {
        s.updateAnnotation(d.id, {
          x: Math.min(p.x, d.anchorX), y: Math.min(p.y, d.anchorY),
          w: Math.abs(p.x - d.anchorX), h: Math.abs(p.y - d.anchorY),
        });
      } else if (d.mode === "line-end") {
        if (d.end === "tip") s.updateAnnotation(d.id, { w: p.x - a.x, h: p.y - a.y });
        else s.updateAnnotation(d.id, { x: p.x, y: p.y, w: a.x + a.w - p.x, h: a.y + a.h - p.y });
      }
    };
    const onUp = () => {
      const d = drag.current;
      if (d?.mode === "draw") {
        const a = useEditor.getState().annotations.find((x) => x.id === d.id);
        if (a) {
          const tooSmall = a.type !== "text" && Math.abs(a.w) < 6 && Math.abs(a.h) < 6;
          const penTooShort = a.type === "pen" && (a.points?.length ?? 0) < 2;
          if ((a.type !== "pen" && tooSmall) || penTooShort) s.deleteAnnotation(a.id);
        }
      }
      drag.current = null;
      dragRect.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitScale]);

  const onLayerPointerDown = (e: React.PointerEvent) => {
    if (editingId) return;
    const p = toLocal(e.clientX, e.clientY);

    if (s.tool === "select") {
      s.set("selectedId", null);
      return;
    }
    if (s.tool === "text") {
      const a: Annotation = { id: uid(), type: "text", x: p.x, y: p.y, w: 0, h: 0, color: s.annColor, strokeWidth: s.annWidth, text: "Text", fontSize: s.annFontSize, bg: s.annBg };
      s.addAnnotation(a);
      setEditingId(a.id);
      s.set("tool", "select");
      return;
    }
    if (s.tool === "step") {
      // Click-to-place numbered badge (keeps the tool so you can place a series).
      const a: Annotation = { id: uid(), type: "step", x: p.x, y: p.y, w: 0, h: 0, color: s.annColor, strokeWidth: s.annWidth };
      s.addAnnotation(a);
      return;
    }
    const a: Annotation = {
      id: uid(), type: s.tool, x: p.x, y: p.y, w: 0, h: 0, color: s.annColor, strokeWidth: s.annWidth,
      ...(s.tool === "pen" ? { points: [p] } : {}),
    };
    s.addAnnotation(a);
    beginDrag();
    drag.current = { mode: "draw", id: a.id };
    e.preventDefault();
  };

  const startMove = (e: React.PointerEvent, a: Annotation) => {
    if (s.tool !== "select" || editingId === a.id) return;
    e.stopPropagation();
    s.set("selectedId", a.id);
    s.beginHistory();
    beginDrag();
    const p = toLocal(e.clientX, e.clientY);
    drag.current = {
      mode: "move", id: a.id, startX: p.x, startY: p.y, ox: a.x, oy: a.y,
      origPts: a.type === "pen" ? a.points?.map((pt) => ({ ...pt })) : undefined,
    };
  };

  const startResize = (e: React.PointerEvent, a: Annotation, corner: Corner) => {
    e.stopPropagation();
    s.beginHistory();
    beginDrag();
    const b = bounds(a);
    const anchorX = corner === "nw" || corner === "sw" ? b.left + b.width : b.left;
    const anchorY = corner === "nw" || corner === "ne" ? b.top + b.height : b.top;
    drag.current = { mode: "resize", id: a.id, corner, anchorX, anchorY };
  };

  const startLineEnd = (e: React.PointerEvent, a: Annotation, end: "start" | "tip") => {
    e.stopPropagation();
    s.beginHistory();
    beginDrag();
    drag.current = { mode: "line-end", id: a.id, end };
  };

  const selected = s.annotations.find((a) => a.id === s.selectedId) || null;
  const cursor = s.tool === "select" ? "default" : s.tool === "text" ? "text" : "crosshair";
  const moveCursor = s.tool === "select" ? "move" : cursor;

  // Auto-number the step badges by their order in the array.
  const stepNumbers = new Map<string, number>();
  let stepN = 0;
  for (const a of s.annotations) if (a.type === "step") stepNumbers.set(a.id, ++stepN);

  const focuses = s.annotations.filter((a) => a.type === "focus");

  return (
    <div
      ref={layerRef}
      onPointerDown={onLayerPointerDown}
      style={{ position: "absolute", inset: 0, cursor, touchAction: "none", userSelect: "none" }}
    >
      {/* Spotlight: one dark overlay with a transparent hole per focus region. */}
      {focuses.length > 0 && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <mask id="glow-focus-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {focuses.map((f) => {
                const b = bounds(f);
                return <rect key={f.id} x={b.left} y={b.top} width={b.width} height={b.height} rx={8} fill="black" />;
              })}
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#glow-focus-mask)" />
        </svg>
      )}

      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        {s.annotations.map((a) => {
          const stroke = { stroke: a.color, strokeWidth: a.strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
          if (a.type === "arrow" || a.type === "line") {
            const x1 = a.x, y1 = a.y, x2 = a.x + a.w, y2 = a.y + a.h;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const head = a.type === "arrow" ? Math.max(10, a.strokeWidth * 3.2) : 0;
            const hx = x2 - head * Math.cos(angle);
            const hy = y2 - head * Math.sin(angle);
            const spread = head * 0.55;
            return (
              <g key={a.id} onPointerDown={(e) => startMove(e, a)} style={{ cursor: moveCursor }}>
                <line x1={x1} y1={y1} x2={a.type === "arrow" ? hx : x2} y2={a.type === "arrow" ? hy : y2} {...stroke} />
                {a.type === "arrow" && (
                  <polygon
                    points={`${x2},${y2} ${hx - spread * Math.sin(angle)},${hy + spread * Math.cos(angle)} ${hx + spread * Math.sin(angle)},${hy - spread * Math.cos(angle)}`}
                    fill={a.color}
                  />
                )}
                {/* invisible fat hit-line for easier selection */}
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={Math.max(12, a.strokeWidth + 8)} />
              </g>
            );
          }
          if (a.type === "pen" && a.points) {
            return (
              <polyline key={a.id} onPointerDown={(e) => startMove(e, a)}
                points={a.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none" {...stroke} style={{ cursor: moveCursor }} />
            );
          }
          const b = bounds(a);
          if (a.type === "box") {
            return <rect key={a.id} onPointerDown={(e) => startMove(e, a)} x={b.left} y={b.top} width={b.width} height={b.height} rx={6} fill="transparent" {...stroke} style={{ cursor: moveCursor }} />;
          }
          if (a.type === "ellipse") {
            return <ellipse key={a.id} onPointerDown={(e) => startMove(e, a)} cx={b.left + b.width / 2} cy={b.top + b.height / 2} rx={b.width / 2} ry={b.height / 2} fill="transparent" {...stroke} style={{ cursor: moveCursor }} />;
          }
          if (a.type === "highlight") {
            return <rect key={a.id} onPointerDown={(e) => startMove(e, a)} x={b.left} y={b.top} width={b.width} height={b.height} rx={4} fill={a.color} fillOpacity={0.32} stroke="none" style={{ cursor: moveCursor }} />;
          }
          if (a.type === "focus") {
            // Transparent fill = draggable hit area over the spotlight hole; dashed border shows the region.
            return (
              <rect key={a.id} onPointerDown={(e) => startMove(e, a)} x={b.left} y={b.top} width={b.width} height={b.height} rx={8}
                fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="6 4" style={{ cursor: moveCursor }} />
            );
          }
          if (a.type === "step") {
            const d = stepDiameter(a);
            return (
              <g key={a.id} onPointerDown={(e) => startMove(e, a)} style={{ cursor: moveCursor }}>
                <circle cx={a.x} cy={a.y} r={d / 2} fill={a.color} stroke="#fff" strokeWidth={2} />
                <text x={a.x} y={a.y} textAnchor="middle" dominantBaseline="central" fill="#fff"
                  fontSize={d * 0.5} fontWeight={700} fontFamily="var(--font-sans), sans-serif" style={{ pointerEvents: "none" }}>
                  {stepNumbers.get(a.id)}
                </text>
              </g>
            );
          }
          return null;
        })}
      </svg>

      {/* Real pixelation blocks (canvas, so they serialize on export) */}
      {s.annotations.filter((a) => a.type === "blur").map((a) => (
        <PixelBlock key={a.id} a={a} baseRaster={baseRaster} rasterScale={rasterScale}
          cursor={moveCursor} onPointerDown={(e) => startMove(e, a)} />
      ))}

      {/* Text labels */}
      {s.annotations.filter((a) => a.type === "text").map((a) => (
        <div
          key={a.id}
          data-ann-text={a.id}
          onPointerDown={(e) => startMove(e, a)}
          onDoubleClick={() => { s.set("tool", "select"); setEditingId(a.id); }}
          contentEditable={editingId === a.id}
          suppressContentEditableWarning
          onBlur={(e) => { s.updateAnnotation(a.id, { text: e.currentTarget.textContent || "" }); setEditingId(null); }}
          style={{
            position: "absolute", left: a.x, top: a.y, color: a.color, fontSize: a.fontSize, fontWeight: 700,
            fontFamily: "var(--font-sans), sans-serif", lineHeight: 1.2,
            padding: a.bg ? "6px 12px" : "2px 4px", whiteSpace: "nowrap",
            outline: editingId === a.id ? "2px solid var(--color-accent)" : "none",
            borderRadius: a.bg ? 8 : 4,
            background: a.bg ? "rgba(10,10,15,0.72)" : undefined,
            cursor: editingId === a.id ? "text" : moveCursor,
            textShadow: a.bg ? "none" : "0 1px 2px rgba(0,0,0,0.25)",
          }}
        >
          {a.text}
        </div>
      ))}

      {selected && s.tool === "select" && editingId !== selected.id && (
        <SelectionHandles selected={selected} fitScale={fitScale} onResize={startResize} onLineEnd={startLineEnd} />
      )}
    </div>
  );
}

/** Move-only dashed outline for a selected text label, sized to its DOM box. */
function TextSelectionOutline({
  selected,
  fitScale,
}: {
  selected: Annotation;
  fitScale: number;
}) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    // Measuring the rendered text node is exactly what a layout effect is for.
    const el = document.querySelector<HTMLElement>(`[data-ann-text="${selected.id}"]`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (el) setBox({ w: el.offsetWidth, h: el.offsetHeight });
  }, [selected.id, selected.text, selected.fontSize, selected.bg]);

  if (!box) return null;
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <rect
        x={selected.x}
        y={selected.y}
        width={box.w}
        height={box.h}
        rx={selected.bg ? 8 : 4}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1 / fitScale}
        strokeDasharray={`${4 / fitScale} ${3 / fitScale}`}
      />
    </svg>
  );
}

function PixelBlock({
  a, baseRaster, rasterScale, cursor, onPointerDown,
}: {
  a: Annotation;
  baseRaster: HTMLCanvasElement | null;
  rasterScale: number;
  cursor: string;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const b = bounds(a);

  useEffect(() => {
    const cnv = ref.current;
    if (!cnv) return;
    const w = Math.max(1, Math.round(b.width));
    const h = Math.max(1, Math.round(b.height));
    const dpr = 2;
    cnv.width = w * dpr;
    cnv.height = h * dpr;
    const ctx = cnv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    if (baseRaster && rasterScale && b.width > 0 && b.height > 0) {
      const px = Math.max(5, a.strokeWidth * 2.6); // pixel block size (natural px)
      const cols = Math.max(1, Math.round(b.width / px));
      const rows = Math.max(1, Math.round(b.height / px));
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.imageSmoothingEnabled = true;
      octx.drawImage(
        baseRaster,
        b.left * rasterScale, b.top * rasterScale, b.width * rasterScale, b.height * rasterScale,
        0, 0, cols, rows
      );
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, cols, rows, 0, 0, cnv.width, cnv.height);
    } else {
      // Fallback until the raster is ready — still obscures.
      ctx.fillStyle = "rgba(125,127,138,0.85)";
      ctx.fillRect(0, 0, cnv.width, cnv.height);
    }
  }, [a.strokeWidth, baseRaster, rasterScale, b.left, b.top, b.width, b.height]);

  return (
    <canvas
      ref={ref}
      onPointerDown={onPointerDown}
      style={{ position: "absolute", left: b.left, top: b.top, width: b.width, height: b.height, borderRadius: 6, cursor, display: "block" }}
    />
  );
}

function SelectionHandles({
  selected, fitScale, onResize, onLineEnd,
}: {
  selected: Annotation;
  fitScale: number;
  onResize: (e: React.PointerEvent, a: Annotation, corner: Corner) => void;
  onLineEnd: (e: React.PointerEvent, a: Annotation, end: "start" | "tip") => void;
}) {
  const handleSize = 9 / fitScale;
  const svgStyle = { position: "absolute" as const, inset: 0, width: "100%", height: "100%", overflow: "visible" as const };

  if (selected.type === "arrow" || selected.type === "line") {
    const pts: { x: number; y: number; end: "start" | "tip" }[] = [
      { x: selected.x, y: selected.y, end: "start" },
      { x: selected.x + selected.w, y: selected.y + selected.h, end: "tip" },
    ];
    return (
      <svg style={svgStyle}>
        {pts.map((pt) => (
          <rect key={pt.end} x={pt.x - handleSize / 2} y={pt.y - handleSize / 2} width={handleSize} height={handleSize}
            fill="#fff" stroke="var(--color-accent)" strokeWidth={1.5 / fitScale} rx={2 / fitScale}
            style={{ cursor: "pointer" }} onPointerDown={(e) => onLineEnd(e, selected, pt.end)} />
        ))}
      </svg>
    );
  }

  // Numbered step badge: a selection ring, move-only.
  if (selected.type === "step") {
    const d = stepDiameter(selected);
    return (
      <svg style={svgStyle}>
        <circle cx={selected.x} cy={selected.y} r={d / 2 + 4 / fitScale} fill="none"
          stroke="var(--color-accent)" strokeWidth={1.5 / fitScale} strokeDasharray={`${4 / fitScale} ${3 / fitScale}`} />
      </svg>
    );
  }

  // Text: no corner handles (font-size, not a box, controls its size) — just a
  // dashed outline measured from the rendered node so it hugs the actual text.
  if (selected.type === "text") {
    return <TextSelectionOutline selected={selected} fitScale={fitScale} />;
  }

  const b = bounds(selected);
  // Freehand pen: show the bounding box but no corner handles (move-only).
  if (selected.type === "pen") {
    return (
      <svg style={svgStyle}>
        <rect x={b.left} y={b.top} width={b.width} height={b.height} fill="none"
          stroke="var(--color-accent)" strokeWidth={1 / fitScale} strokeDasharray={`${4 / fitScale} ${3 / fitScale}`} />
      </svg>
    );
  }

  const corners: { c: Corner; x: number; y: number; cur: string }[] = [
    { c: "nw", x: b.left, y: b.top, cur: "nwse-resize" },
    { c: "ne", x: b.left + b.width, y: b.top, cur: "nesw-resize" },
    { c: "sw", x: b.left, y: b.top + b.height, cur: "nesw-resize" },
    { c: "se", x: b.left + b.width, y: b.top + b.height, cur: "nwse-resize" },
  ];
  return (
    <svg style={svgStyle}>
      <rect x={b.left} y={b.top} width={b.width} height={b.height} fill="none"
        stroke="var(--color-accent)" strokeWidth={1 / fitScale} strokeDasharray={`${4 / fitScale} ${3 / fitScale}`} />
      {corners.map((cn) => (
        <rect key={cn.c} x={cn.x - handleSize / 2} y={cn.y - handleSize / 2} width={handleSize} height={handleSize}
          fill="#fff" stroke="var(--color-accent)" strokeWidth={1.5 / fitScale} rx={2 / fitScale}
          style={{ cursor: cn.cur }} onPointerDown={(e) => onResize(e, selected, cn.c)} />
      ))}
    </svg>
  );
}
