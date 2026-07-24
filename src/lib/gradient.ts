import type { GradStop, GradType } from "./types";

/** Build a CSS gradient from a type + angle + stops. */
export function buildGradientCss(type: GradType, angle: number, stops: GradStop[]): string {
  const parts = [...stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.color} ${Math.round(s.pos)}%`)
    .join(", ");
  const a = Math.round(angle);
  if (type === "radial") return `radial-gradient(circle at 50% 50%, ${parts})`;
  if (type === "conic") return `conic-gradient(from ${a}deg at 50% 50%, ${parts})`;
  return `linear-gradient(${a}deg, ${parts})`;
}

/** Split a gradient's argument list on top-level commas (ignores commas in `rgb(...)`). */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

const TO_ANGLE: Record<string, number> = {
  "to top": 0,
  "to right": 90,
  "to bottom": 180,
  "to left": 270,
  "to top right": 45,
  "to bottom right": 135,
  "to bottom left": 225,
  "to top left": 315,
};

const COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/;

/**
 * Parse a `linear-gradient(...)` string back into an angle + stops so a preset
 * can be loaded into the editor and tweaked. Returns null for non-linear
 * gradients (e.g. the mesh backgrounds).
 */
export function parseLinearGradient(css: string): { angle: number; stops: GradStop[] } | null {
  const m = css.match(/linear-gradient\((.*)\)\s*$/i);
  if (!m) return null;
  const tokens = splitTopLevel(m[1]).map((t) => t.trim());
  if (tokens.length === 0) return null;

  let angle = 135;
  let start = 0;
  const first = tokens[0];
  const deg = first.match(/^(-?\d+(?:\.\d+)?)deg$/);
  if (deg) {
    angle = parseFloat(deg[1]);
    start = 1;
  } else if (/^to\s+/i.test(first)) {
    angle = TO_ANGLE[first.toLowerCase().replace(/\s+/g, " ")] ?? 135;
    start = 1;
  }

  const stops: GradStop[] = [];
  for (let i = start; i < tokens.length; i++) {
    const t = tokens[i];
    const cm = t.match(COLOR);
    if (!cm) continue;
    const color = cm[0];
    const rest = t.slice(color.length).trim();
    const pm = rest.match(/(-?\d+(?:\.\d+)?)%/);
    stops.push({ color, pos: pm ? parseFloat(pm[1]) : NaN });
  }
  if (stops.length < 2) return null;

  // Distribute any stops that had no explicit position evenly across 0–100.
  stops.forEach((s, i) => {
    if (Number.isNaN(s.pos)) s.pos = (i / (stops.length - 1)) * 100;
  });
  return { angle, stops };
}
