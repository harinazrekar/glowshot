import type { Annotation, Background, GradStop, GradType } from "./types";
import { ALL_BACKGROUNDS } from "./presets";

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
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object") return obj as Partial<ShareableState>;
    return null;
  } catch {
    return null;
  }
}

/**
 * Rehydrate a shared background. Known presets are resolved back to their
 * canonical object; anything custom (solid color) is trusted as-is.
 */
export function resolveBackground(bg: Background | undefined): Background | undefined {
  if (!bg) return undefined;
  return ALL_BACKGROUNDS.find((b) => b.id === bg.id) ?? bg;
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
