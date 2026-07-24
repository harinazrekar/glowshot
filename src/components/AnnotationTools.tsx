"use client";

import {
  ArrowUpRight,
  Circle,
  CircleDot,
  Grid2x2,
  Highlighter,
  Minus,
  MousePointer2,
  Pen,
  Redo2,
  ScanEye,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { useEditor } from "@/lib/store";
import { clamp } from "@/lib/util";
import {
  ANNOTATION_TOOLS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  STROKE_WIDTHS,
} from "@/lib/annotations";
import type { Tool } from "@/lib/types";
import { ColorSwatchInput, IconButton } from "./ui";

const TOOL_ICONS: Record<Tool, React.ReactNode> = {
  select: <MousePointer2 size={17} />,
  pen: <Pen size={17} />,
  arrow: <ArrowUpRight size={17} />,
  line: <Minus size={17} />,
  box: <Square size={17} />,
  ellipse: <Circle size={17} />,
  highlight: <Highlighter size={17} />,
  text: <Type size={17} />,
  step: <CircleDot size={17} />,
  focus: <ScanEye size={17} />,
  blur: <Grid2x2 size={17} />,
};

const COLORS = ["#ff3b6b", "#ffb020", "#22c55e", "#3b82f6"];

export function AnnotationTools() {
  const s = useEditor();

  // The rail sets DEFAULTS for the next text label (shown while the text tool
  // is active). Editing an existing label is handled by AnnotationInspector.
  const textActive = s.tool === "text";

  const bumpSize = (delta: number) =>
    s.set("annFontSize", clamp(s.annFontSize + delta, FONT_SIZE_MIN, FONT_SIZE_MAX));
  const toggleBg = () => s.set("annBg", !s.annBg);

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1 p-1.5 rounded-2xl bg-panel/90 backdrop-blur border border-border shadow-xl max-h-[calc(100vh-140px)] overflow-y-auto">
      {ANNOTATION_TOOLS.map((t) => (
        <IconButton
          key={t.id}
          active={s.tool === t.id}
          title={`${t.label}  (${t.key})`}
          onClick={() => s.set("tool", t.id)}
        >
          {TOOL_ICONS[t.id]}
        </IconButton>
      ))}

      <div className="w-6 h-px bg-border my-1" />

      {/* Color picker */}
      <div className="relative w-9 h-9 grid place-items-center">
        <ColorSwatchInput
          title="Annotation color"
          value={s.annColor}
          onChange={(v) => s.set("annColor", v)}
          className="w-6 h-6 rounded-full border-2 border-white/25"
        />
      </div>
      <div className="flex flex-col gap-1 pb-1">
        {COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => s.set("annColor", c)}
            className={`w-4 h-4 mx-auto rounded-full border ${
              s.annColor.toLowerCase() === c ? "border-white ring-2 ring-accent/50" : "border-white/20"
            }`}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* Stroke width */}
      <div className="flex flex-col items-center gap-1 py-1" title="Stroke width">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => s.set("annWidth", w)}
            className={`w-9 h-6 grid place-items-center rounded-lg transition-colors ${
              s.annWidth === w ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <span className="rounded-full bg-fg" style={{ width: 16, height: Math.max(2, w) }} />
          </button>
        ))}
      </div>

      {/* Text defaults — shown while the text tool is active */}
      {textActive && (
        <>
          <div className="w-6 h-px bg-border my-1" />
          <div className="flex flex-col items-center gap-1" title="Text size">
            <button
              onClick={() => bumpSize(2)}
              className="w-9 h-6 grid place-items-center rounded-lg text-fg hover:bg-white/8 transition-colors font-semibold text-[15px] leading-none"
            >
              A
            </button>
            <button
              onClick={() => bumpSize(-2)}
              className="w-9 h-6 grid place-items-center rounded-lg text-muted hover:text-fg hover:bg-white/8 transition-colors font-semibold text-[11px] leading-none"
            >
              A
            </button>
          </div>
          <IconButton
            title={s.annBg ? "Remove text background" : "Add text background pill"}
            active={s.annBg}
            onClick={toggleBg}
          >
            <Type size={16} />
          </IconButton>
        </>
      )}

      <div className="w-6 h-px bg-border my-1" />

      <IconButton title="Undo (⌘Z)" disabled={s.past.length === 0} onClick={s.undo}>
        <Undo2 size={16} />
      </IconButton>
      <IconButton title="Redo (⌘⇧Z)" disabled={s.future.length === 0} onClick={s.redo}>
        <Redo2 size={16} />
      </IconButton>
      <IconButton title="Clear all" disabled={s.annotations.length === 0} onClick={s.clearAnnotations}>
        <Trash2 size={16} />
      </IconButton>
    </div>
  );
}
