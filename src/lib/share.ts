import type { Annotation, AnnotationType, Background, GradStop, GradType, Point } from "./types";
import {
  ALL_BACKGROUNDS,
  ASPECT_RATIOS,
  CODE_FONTS,
  CODE_LANGS,
  CODE_THEMES,
  SHADOWS,
  TRANSPARENT,
} from "./presets";
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "./annotations";
import { buildGradientCss } from "./gradient";
import { uid } from "./util";

/**
 * Client-only "share via link" — the entire design is encoded into the URL
 * hash, so a snippet round-trips with zero backend and zero signup. Large
 * binary state (uploaded image / background image data URLs) is intentionally
 * excluded to keep links pasteable.
 */

export interface ShareableState {
  mode: "image" | "code";
  code: string;
  codeLang: string;
  codeTheme: string;
  codeFont: string;
  ligatures: boolean;
  wrap: boolean;
  showLineNumbers: boolean;
  codeFontSize: number;
  highlightedLines: number[];
  dimUnfocused: boolean;
  diff: boolean;
  windowTitle: string;
  frame: string;
  frameTheme: string;
  hideControls: boolean;
  background: Background;
  gradType: GradType;
  gradAngle: number;
  gradStops: GradStop[];
  padding: number;
  radius: number;
  shadow: string;
  aspectRatio: string;
  watermark: boolean;
  tiltX: number;
  tiltY: number;
  noise: boolean;
  borderWidth: number;
  borderColor: string;
  annotations: Annotation[];
  annColor: string;
  annWidth: number;
  annFontSize: number;
  annBg: boolean;
}

/** Keys pulled from / pushed to the editor store when (de)serializing. */
export const SHARE_KEYS: (keyof ShareableState)[] = [
  "mode",
  "code",
  "codeLang",
  "codeTheme",
  "codeFont",
  "ligatures",
  "wrap",
  "showLineNumbers",
  "codeFontSize",
  "highlightedLines",
  "dimUnfocused",
  "diff",
  "windowTitle",
  "frame",
  "frameTheme",
  "hideControls",
  "background",
  "gradType",
  "gradAngle",
  "gradStops",
  "padding",
  "radius",
  "shadow",
  "aspectRatio",
  "watermark",
  "tiltX",
  "tiltY",
  "noise",
  "borderWidth",
  "borderColor",
  "annotations",
  "annColor",
  "annWidth",
  "annFontSize",
  "annBg",
];

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeShare(state: Partial<ShareableState>): string {
  const json = JSON.stringify(state);
  return toBase64Url(new TextEncoder().encode(json));
}

export function decodeShare(token: string): Partial<ShareableState> | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(token));
    return sanitizeShared(JSON.parse(json));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Sanitization.
 *
 * A share token is fully attacker-controlled (anyone can craft the hash),
 * so nothing decoded from it may be trusted. Without this guard a token
 * could (a) crash the recipient's editor by setting a wrong-typed field —
 * e.g. `annotations` as a number, which then throws in `.map`/`.some` — or
 * (b) smuggle arbitrary CSS into an inline `background` (`url(https://…)`),
 * loading remote resources into the editor and the exported image.
 *
 * Every field is validated, enums are whitelisted against the preset lists,
 * numbers are clamped to their control ranges, and colors/CSS are never
 * trusted verbatim — background CSS is rebuilt from validated primitives.
 * Unknown or invalid fields are dropped, leaving the editor's default.
 * ------------------------------------------------------------------ */

const ANNOTATION_TYPES: readonly AnnotationType[] = [
  "arrow",
  "line",
  "box",
  "ellipse",
  "highlight",
  "pen",
  "text",
  "step",
  "focus",
  "blur",
];

/** Only plain hex / rgb(a) / hsl(a) — no `url()`, `image-set()`, `@import`, etc. */
const SAFE_COLOR =
  /^#[0-9a-fA-F]{3,8}$|^(?:rgb|rgba|hsl|hsla)\([\d.,%\s/]+\)$/;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asBool = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;

const asNum = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : undefined;

const asStr = (v: unknown, maxLen: number): string | undefined =>
  typeof v === "string" ? v.slice(0, maxLen) : undefined;

const asEnum = <T extends string>(
  v: unknown,
  allowed: readonly T[]
): T | undefined =>
  typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : undefined;

const asColor = (v: unknown): string | undefined =>
  typeof v === "string" && SAFE_COLOR.test(v.trim()) ? v.trim() : undefined;

function asLineArray(v: unknown): number[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v
    .filter(
      (n): n is number =>
        typeof n === "number" && Number.isInteger(n) && n > 0 && n <= 100_000
    )
    .slice(0, 10_000);
}

function asStops(v: unknown): GradStop[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const stops = v
    .map((s) =>
      isObj(s) ? { color: asColor(s.color), pos: asNum(s.pos, 0, 100) } : null
    )
    .filter(
      (s): s is { color: string; pos: number } =>
        !!s && s.color !== undefined && s.pos !== undefined
    )
    .slice(0, 5);
  // The gradient editor requires ≥2 stops; fewer would crash addStop().
  return stops.length >= 2 ? stops : undefined;
}

function asAnnotation(raw: unknown): Annotation | null {
  if (!isObj(raw)) return null;
  const type = asEnum(raw.type, ANNOTATION_TYPES);
  const x = asNum(raw.x, -100_000, 100_000);
  const y = asNum(raw.y, -100_000, 100_000);
  const w = asNum(raw.w, -100_000, 100_000);
  const h = asNum(raw.h, -100_000, 100_000);
  const color = asColor(raw.color);
  const strokeWidth = asNum(raw.strokeWidth, 0, 200);
  if (
    !type ||
    x === undefined ||
    y === undefined ||
    w === undefined ||
    h === undefined ||
    color === undefined ||
    strokeWidth === undefined
  ) {
    return null;
  }
  const a: Annotation = { id: asStr(raw.id, 64) ?? uid(), type, x, y, w, h, color, strokeWidth };
  const text = asStr(raw.text, 2000);
  if (text !== undefined) a.text = text;
  const fontSize = asNum(raw.fontSize, FONT_SIZE_MIN, FONT_SIZE_MAX);
  if (fontSize !== undefined) a.fontSize = fontSize;
  const bg = asBool(raw.bg);
  if (bg !== undefined) a.bg = bg;
  if (Array.isArray(raw.points)) {
    const pts = raw.points
      .map((p) =>
        isObj(p)
          ? { x: asNum(p.x, -100_000, 100_000), y: asNum(p.y, -100_000, 100_000) }
          : null
      )
      .filter(
        (p): p is Point => !!p && p.x !== undefined && p.y !== undefined
      )
      .slice(0, 5000);
    if (pts.length) a.points = pts;
  }
  return a;
}

function asAnnotations(v: unknown): Annotation[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: Annotation[] = [];
  for (const raw of v.slice(0, 500)) {
    const a = asAnnotation(raw);
    if (a) out.push(a);
  }
  return out;
}

/**
 * Resolve a shared background WITHOUT trusting its `css`. Known presets map
 * back to their canonical object; a custom solid must be a safe color; a
 * custom gradient is rebuilt from the (already sanitized) grad primitives.
 * Anything else (mesh/image custom, malformed) is dropped.
 */
function sanitizeBackground(
  v: unknown,
  gradType: GradType,
  gradAngle: number,
  stops: GradStop[] | undefined
): Background | undefined {
  if (!isObj(v)) return undefined;
  const id = asStr(v.id, 64);
  const preset = id ? ALL_BACKGROUNDS.find((b) => b.id === id) : undefined;
  if (preset) return preset;

  const type = asEnum(v.type, [
    "gradient",
    "mesh",
    "solid",
    "transparent",
    "image",
  ] as const);
  if (type === "transparent") return TRANSPARENT;
  if (type === "solid") {
    const css = asColor(v.css);
    return css ? { id: "custom", name: "Custom", type: "solid", css } : undefined;
  }
  if ((type === "gradient" || id === "custom-gradient") && stops) {
    return {
      id: "custom-gradient",
      name: "Custom",
      type: "gradient",
      css: buildGradientCss(gradType, gradAngle, stops),
    };
  }
  return undefined;
}

/** Validate & clamp attacker-controlled decoded share state. */
export function sanitizeShared(input: unknown): Partial<ShareableState> {
  if (!isObj(input)) return {};
  const out: Partial<ShareableState> = {};
  const keep = <K extends keyof ShareableState>(
    key: K,
    val: ShareableState[K] | undefined
  ) => {
    if (val !== undefined) out[key] = val;
  };

  keep("mode", asEnum(input.mode, ["image", "code"] as const));
  keep("code", asStr(input.code, 100_000));
  keep("codeLang", asEnum(input.codeLang, CODE_LANGS));
  keep("codeTheme", asEnum(input.codeTheme, CODE_THEMES.map((t) => t.id)));
  keep("codeFont", asEnum(input.codeFont, CODE_FONTS.map((f) => f.id)));
  keep("ligatures", asBool(input.ligatures));
  keep("wrap", asBool(input.wrap));
  keep("showLineNumbers", asBool(input.showLineNumbers));
  keep("codeFontSize", asNum(input.codeFontSize, 10, 24));
  keep("highlightedLines", asLineArray(input.highlightedLines));
  keep("dimUnfocused", asBool(input.dimUnfocused));
  keep("diff", asBool(input.diff));
  keep("windowTitle", asStr(input.windowTitle, 200));
  keep("frame", asEnum(input.frame, ["none", "mac", "browser", "windows"] as const));
  keep("frameTheme", asEnum(input.frameTheme, ["light", "dark"] as const));
  keep("gradType", asEnum(input.gradType, ["linear", "radial", "conic"] as const));
  keep("gradAngle", asNum(input.gradAngle, 0, 360));
  const gradStops = asStops(input.gradStops);
  keep("gradStops", gradStops);
  keep("padding", asNum(input.padding, 0, 160));
  keep("radius", asNum(input.radius, 0, 32));
  keep("shadow", asEnum(input.shadow, SHADOWS.map((s) => s.id)));
  keep("aspectRatio", asEnum(input.aspectRatio, ASPECT_RATIOS.map((a) => a.id)));
  keep("hideControls", asBool(input.hideControls));
  keep("watermark", asBool(input.watermark));
  keep("tiltX", asNum(input.tiltX, -24, 24));
  keep("tiltY", asNum(input.tiltY, -24, 24));
  keep("noise", asBool(input.noise));
  keep("borderWidth", asNum(input.borderWidth, 0, 12));
  keep("borderColor", asColor(input.borderColor));
  keep("annColor", asColor(input.annColor));
  keep("annWidth", asNum(input.annWidth, 1, 50));
  keep("annFontSize", asNum(input.annFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX));
  keep("annBg", asBool(input.annBg));
  keep("annotations", asAnnotations(input.annotations));

  // Background last: a custom gradient rebuilds its CSS from the sanitized
  // grad primitives above (defaults matching the store when absent).
  keep(
    "background",
    sanitizeBackground(
      input.background,
      out.gradType ?? "linear",
      out.gradAngle ?? 135,
      gradStops
    )
  );

  return out;
}

/** Build the full shareable URL for the current page. */
export function buildShareUrl(token: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#s=${token}`;
}

/** Read a share token out of the current URL hash, if present. */
export function readShareToken(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/[#&]s=([^&]+)/);
  return m ? m[1] : null;
}
