"use client";

import { Check, Copy, Download, Link2, Star, Image as ImageIcon, Code2 } from "lucide-react";
import { useEditor } from "@/lib/store";
import { BRAND_GRADIENT } from "@/lib/util";
import { Segmented } from "./ui";
import type { InputMode } from "@/lib/types";

const GITHUB_URL = "https://github.com/harinazrekar/glowshot";

interface ToolbarProps {
  onCopy: () => void;
  onDownload: () => void;
  onShare: () => void;
  copied: boolean;
  linkCopied: boolean;
  busy: boolean;
  canCopy: boolean;
}

export function Toolbar({ onCopy, onDownload, onShare, copied, linkCopied, busy, canCopy }: ToolbarProps) {
  const { mode, set, setImage } = useEditor();

  return (
    <header className="h-14 shrink-0 flex items-center gap-4 px-4 border-b border-border bg-panel/80 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-2 select-none">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: BRAND_GRADIENT,
            boxShadow: "0 0 16px rgba(124,92,255,0.6)",
          }}
        >
          <span className="text-white text-sm">✦</span>
        </span>
        <span className="font-semibold tracking-tight text-[15px]">Glowshot</span>
      </div>

      {/* Mode switch */}
      <div className="w-[220px]">
        <Segmented<InputMode>
          value={mode}
          onChange={(v) => {
            if (v === "image") set("mode", "image");
            else setImage(null);
          }}
          options={[
            { value: "code", label: (<span className="inline-flex items-center gap-1.5"><Code2 size={13} /> Code</span>) },
            { value: "image", label: (<span className="inline-flex items-center gap-1.5"><ImageIcon size={13} /> Image</span>) },
          ]}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium text-muted hover:text-fg hover:bg-white/5 transition-colors"
        >
          <Star size={15} />
          <span className="hidden sm:inline">Star on GitHub</span>
        </a>

        <button
          onClick={onShare}
          title="Copy a shareable link to this design"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-panel-2 border border-border hover:border-border-hover text-fg transition-colors"
        >
          {linkCopied ? <Check size={15} className="text-green-400" /> : <Link2 size={15} />}
          <span className="hidden sm:inline">{linkCopied ? "Link copied" : "Share"}</span>
        </button>

        {canCopy && (
          <button
            onClick={onCopy}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-panel-2 border border-border hover:border-border-hover text-fg transition-colors disabled:opacity-50"
          >
            {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}

        <button
          onClick={onDownload}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-60"
          style={{
            background: BRAND_GRADIENT,
            boxShadow: "0 4px 16px -4px rgba(124,92,255,0.6)",
          }}
        >
          <Download size={15} />
          {busy ? "Rendering…" : "Export"}
        </button>
      </div>
    </header>
  );
}
