import type { Tool } from "./types";

/**
 * Single source of truth for the annotation tools: their id, keyboard shortcut,
 * and human label. The rail (icons), the keyboard handler, and the shortcuts
 * modal all derive from this list so they can never drift out of sync.
 */
export const ANNOTATION_TOOLS: { id: Tool; key: string; label: string }[] = [
  { id: "select", key: "V", label: "Select / Move" },
  { id: "pen", key: "P", label: "Freehand pen" },
  { id: "arrow", key: "A", label: "Arrow" },
  { id: "line", key: "L", label: "Line" },
  { id: "box", key: "R", label: "Box" },
  { id: "ellipse", key: "O", label: "Ellipse" },
  { id: "highlight", key: "H", label: "Highlight" },
  { id: "text", key: "T", label: "Text" },
  { id: "step", key: "N", label: "Numbered step" },
  { id: "focus", key: "F", label: "Spotlight / Focus" },
  { id: "blur", key: "B", label: "Pixelate / Redact" },
];

/** Lowercased-key → tool, for the keyboard handler. */
export const TOOL_BY_KEY: Record<string, Tool> = Object.fromEntries(
  ANNOTATION_TOOLS.map((t) => [t.key.toLowerCase(), t.id])
);

/** Stroke-width presets shared by the tool rail and the inspector. */
export const STROKE_WIDTHS = [2, 4, 7];

/** Text-annotation font-size bounds (px). */
export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 96;
