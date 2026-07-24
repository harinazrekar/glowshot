"use client";

import { ChevronDown, ChevronUp, Copy, Trash2, Type } from "lucide-react";
import { useEditor } from "@/lib/store";
import { clamp } from "@/lib/util";
import { FONT_SIZE_MAX, FONT_SIZE_MIN, STROKE_WIDTHS } from "@/lib/annotations";
import type { AnnotationType } from "@/lib/types";
import { ColorSwatchInput, IconButton } from "./ui";

const HAS_COLOR: AnnotationType[] = ["arrow", "line", "box", "ellipse", "highlight", "pen", "text", "step"];
const HAS_STROKE: AnnotationType[] = ["arrow", "line", "box", "ellipse", "pen", "step"];

/**
 * Floating properties bar for the currently selected annotation. Rendered
 * OUTSIDE the export canvas so it never appears in the exported image.
 */
export function AnnotationInspector() {
  const s = useEditor();
  const a = s.annotations.find((x) => x.id === s.selectedId);
  if (!a) return null;

  const edit = (patch: Parameters<typeof s.updateAnnotation>[1]) => {
    s.beginHistory();
    s.updateAnnotation(a.id, patch);
  };

  const hasColor = HAS_COLOR.includes(a.type);
  const hasStroke = HAS_STROKE.includes(a.type);
  const isText = a.type === "text";
  const idx = s.annotations.findIndex((x) => x.id === a.id);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-panel/95 backdrop-blur border border-border shadow-xl">
      {hasColor && (
        <ColorSwatchInput
          title="Color"
          value={a.color}
          onChange={(v) => edit({ color: v })}
          className="w-7 h-7 rounded-lg border-2 border-white/20 shrink-0"
        />
      )}

      {hasStroke && (
        <div className="flex items-center gap-0.5">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              title={`Stroke ${w}px`}
              onClick={() => edit({ strokeWidth: w })}
              className={`w-8 h-8 grid place-items-center rounded-lg transition-colors ${
                a.strokeWidth === w ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span className="rounded-full bg-fg" style={{ width: 15, height: Math.max(2, w) }} />
            </button>
          ))}
        </div>
      )}

      {isText && (
        <div className="flex items-center gap-0.5">
          <button
            title="Larger"
            onClick={() => edit({ fontSize: clamp((a.fontSize ?? 20) + 2, FONT_SIZE_MIN, FONT_SIZE_MAX) })}
            className="w-8 h-8 grid place-items-center rounded-lg text-fg hover:bg-white/8 font-semibold text-[15px] leading-none"
          >
            A
          </button>
          <button
            title="Smaller"
            onClick={() => edit({ fontSize: clamp((a.fontSize ?? 20) - 2, FONT_SIZE_MIN, FONT_SIZE_MAX) })}
            className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:text-fg hover:bg-white/8 font-semibold text-[11px] leading-none"
          >
            A
          </button>
          <IconButton size="sm" title="Background pill" active={!!a.bg} onClick={() => edit({ bg: !a.bg })}>
            <Type size={15} />
          </IconButton>
        </div>
      )}

      <div className="w-px h-6 bg-border mx-0.5" />

      <IconButton size="sm" title="Bring forward ( ] )" disabled={idx >= s.annotations.length - 1} onClick={() => s.raiseAnnotation(a.id)}>
        <ChevronUp size={16} />
      </IconButton>
      <IconButton size="sm" title="Send backward ( [ )" disabled={idx <= 0} onClick={() => s.lowerAnnotation(a.id)}>
        <ChevronDown size={16} />
      </IconButton>
      <IconButton size="sm" title="Duplicate (⌘D)" onClick={() => s.duplicateAnnotation(a.id)}>
        <Copy size={15} />
      </IconButton>
      <IconButton size="sm" title="Delete (⌫)" onClick={() => s.deleteAnnotation(a.id)}>
        <Trash2 size={15} />
      </IconButton>
    </div>
  );
}
