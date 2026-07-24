/**
 * Line-range parsing shared by the "Focus lines" control. Kept pure (no React)
 * so the round-trip between the text input and the highlighted-lines array is
 * unit-testable in isolation.
 */

/** "2, 5-8" -> [2,5,6,7,8] (deduped, sorted, positive only). */
export function parseLines(str: string): number[] {
  const out = new Set<number>();
  for (const tok of str.split(",")) {
    const t = tok.trim();
    if (!t) continue;
    const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i > 0) out.add(i);
    } else if (/^\d+$/.test(t)) {
      const n = Number(t);
      if (n > 0) out.add(n);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** [2,5,6,7,8] -> "2, 5-8" (collapses runs into ranges). */
export function formatLines(nums: number[]): string {
  const s = [...nums].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    parts.push(i === j ? `${s[i]}` : `${s[i]}-${s[j]}`);
    i = j + 1;
  }
  return parts.join(", ");
}
