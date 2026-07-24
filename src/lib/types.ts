export type InputMode = "image" | "code";

export type BackgroundType = "gradient" | "mesh" | "solid" | "transparent" | "image";

export interface Background {
  id: string;
  name: string;
  type: BackgroundType;
  /** CSS value applied to `background`. Empty for transparent. */
  css: string;
}

export interface GradStop {
  color: string;
  /** stop position, 0–100 (%) */
  pos: number;
}

export type GradType = "linear" | "radial" | "conic";

export type FrameStyle = "none" | "mac" | "browser" | "windows";
export type FrameTheme = "light" | "dark";

export type ShadowId = "none" | "sm" | "md" | "lg" | "xl" | "glow";

export interface AspectRatio {
  id: string;
  label: string;
  /** width / height, or null for auto (fit content) */
  ratio: number | null;
}

export interface CodeTheme {
  id: string;
  label: string;
  /** true if the theme is light (affects default frame theme) */
  light?: boolean;
}

/* ---------- Annotations ---------- */

export type AnnotationType =
  | "arrow"
  | "line"
  | "box"
  | "ellipse"
  | "highlight"
  | "pen"
  | "text"
  | "step"
  | "focus"
  | "blur";
export type Tool = "select" | AnnotationType;

export type ExportFormat = "png" | "jpeg" | "svg";

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  /** top-left, in natural (unscaled) content pixels (bbox origin) */
  x: number;
  y: number;
  /** width/height; for arrows/lines these may be negative (direction of travel) */
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  /** text annotations: render on a rounded background pill */
  bg?: boolean;
  /** freehand path points (natural coords), only for type "pen" */
  points?: Point[];
}
