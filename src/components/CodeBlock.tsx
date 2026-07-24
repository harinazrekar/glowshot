"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getHighlighter } from "@/lib/highlighter";

interface CodeBlockProps {
  code: string;
  lang: string;
  theme: string;
  showLineNumbers: boolean;
  fontSize?: number;
  /** CSS font-family value (a --font-* variable). */
  fontFamily?: string;
  ligatures?: boolean;
  wrap?: boolean;
  /** 1-based line numbers to emphasize. */
  highlightedLines?: number[];
  /** Fade every non-highlighted line. */
  dimUnfocused?: boolean;
  /** Style lines beginning with + / - as diff additions / removals. */
  diff?: boolean;
  /** When set, lines are clickable and call this with the 1-based line number. */
  onToggleLine?: (line: number) => void;
}

/**
 * Renders syntax-highlighted code using Shiki. The highlighter is a shared
 * singleton so switching theme/lang is instant after first load.
 */
export function CodeBlock({
  code,
  lang,
  theme,
  showLineNumbers,
  fontSize = 14,
  fontFamily,
  ligatures = true,
  wrap = false,
  highlightedLines = [],
  dimUnfocused = true,
  diff = false,
  onToggleLine,
}: CodeBlockProps) {
  const [rawHtml, setRawHtml] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((hl) => {
      if (cancelled) return;
      try {
        setRawHtml(hl.codeToHtml(code || " ", { lang, theme }));
      } catch {
        // Unknown language fallback
        setRawHtml(hl.codeToHtml(code || " ", { lang: "text", theme }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, theme]);

  // Inject the `hl` / diff classes straight into the Shiki markup so styling is
  // deterministic (no post-render race with dangerouslySetInnerHTML) and also
  // present in the exported image.
  const html = useMemo(() => {
    const needsHl = highlightedLines.length > 0;
    if (!rawHtml || (!needsHl && !diff)) return rawHtml;
    const hl = new Set(highlightedLines);
    const codeLines = code.split("\n");
    let n = 0;
    return rawHtml.replace(/<span class="line"/g, () => {
      n++;
      const extra: string[] = [];
      if (hl.has(n)) extra.push("hl");
      if (diff) {
        const t = (codeLines[n - 1] ?? "").trimStart();
        if (t.startsWith("+") && !t.startsWith("++")) extra.push("diff-add");
        else if (t.startsWith("-") && !t.startsWith("--")) extra.push("diff-remove");
      }
      return extra.length ? `<span class="line ${extra.join(" ")}"` : '<span class="line"';
    });
  }, [rawHtml, highlightedLines, diff, code]);

  const interactive = !!onToggleLine;

  const handleClick = (e: React.MouseEvent) => {
    if (!onToggleLine) return;
    const line = (e.target as HTMLElement).closest(".line");
    if (!line || !ref.current) return;
    const lines = Array.from(ref.current.querySelectorAll(".line"));
    const idx = lines.indexOf(line);
    if (idx >= 0) onToggleLine(idx + 1);
  };

  const style: React.CSSProperties = {
    fontSize,
    lineHeight: 1.6,
    fontFamily: fontFamily
      ? `${fontFamily}, ui-monospace, monospace`
      : undefined,
    fontVariantLigatures: ligatures ? "normal" : "none",
    fontFeatureSettings: ligatures ? undefined : '"liga" 0, "calt" 0',
  };

  const className = [
    "glow-code",
    showLineNumbers && "with-lines",
    wrap && "wrap",
    dimUnfocused && highlightedLines.length > 0 && "dim",
    interactive && "interactive",
  ]
    .filter(Boolean)
    .join(" ");

  if (!html) {
    return (
      <div className="whitespace-pre font-mono text-white/40" style={style}>
        {code}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onClick={interactive ? handleClick : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
