import { createHighlighter, type Highlighter } from "shiki";
import { CODE_LANGS, CODE_THEMES } from "./presets";

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Single shared Shiki highlighter. Themes + langs are bundled up-front so that
 * theme/language switching in the UI is instant (no async flash on every change).
 */
export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: CODE_THEMES.map((t) => t.id),
      langs: [...CODE_LANGS],
    });
  }
  return highlighterPromise;
}

/** Very small heuristic language guesser used on first paste. */
export function guessLanguage(code: string): string | null {
  const s = code.slice(0, 2000);
  const has = (re: RegExp) => re.test(s);
  if (has(/^\s*<\?php/)) return "php";
  if (has(/^\s*(import\s+\w+\s+from|export\s+(default|const|function)|const\s+\w+\s*=\s*<)/m) && has(/<\/?[A-Z]\w*/)) return "tsx";
  if (has(/\bdef\s+\w+\s*\(|^\s*import\s+\w+$|print\(/m)) return "python";
  if (has(/\bfn\s+\w+|let\s+mut\b|println!/)) return "rust";
  if (has(/\bpackage\s+main\b|func\s+\w+\s*\(|fmt\.Print/)) return "go";
  if (has(/\bpublic\s+class\b|System\.out\.println/)) return "java";
  if (has(/^\s*#include\b|std::/m)) return "cpp";
  if (has(/^\s*(SELECT|INSERT|UPDATE|DELETE)\b/im)) return "sql";
  if (has(/<\/?[a-z][\s\S]*>/i) && has(/<(!doctype|html|div|span|body)/i)) return "html";
  if (has(/^\s*{[\s\S]*"\w+"\s*:/)) return "json";
  if (has(/:\s*(interface|type)\b|:\s*\w+(\[\])?\s*[;=]/)) return "typescript";
  if (has(/\bfunction\b|=>|const\s+|let\s+/)) return "javascript";
  return null;
}
