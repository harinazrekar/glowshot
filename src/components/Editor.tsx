"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Keyboard, Upload } from "lucide-react";
import { useEditor } from "@/lib/store";
import { fileToDataUrl } from "@/lib/util";
import { TOOL_BY_KEY } from "@/lib/annotations";
import { canCopyImages, copyImage, downloadImage, downloadSvg } from "@/lib/export";
import { guessLanguage } from "@/lib/highlighter";
import { CODE_LANGS } from "@/lib/presets";
import {
  buildShareUrl,
  decodeShare,
  encodeShare,
  readShareToken,
  SHARE_KEYS,
} from "@/lib/share";
import { Canvas } from "./Canvas";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { AnnotationTools } from "./AnnotationTools";
import { AnnotationInspector } from "./AnnotationInspector";
import { ShortcutsModal } from "./ShortcutsModal";

export function Editor() {
  const s = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rasterRefreshRef = useRef<null | (() => Promise<void>)>(null);
  // Timestamp of the last arrow-key nudge, so a burst of presses (incl. key
  // auto-repeat) collapses into a single undo step instead of one per key.
  const lastNudgeRef = useRef(0);

  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [canCopy, setCanCopy] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Flip to client-rendered after mount so the persisted store hydrates cleanly,
  // and probe clipboard support here too (ClipboardItem is undefined during SSR,
  // so doing it post-mount avoids a hydration mismatch on the Copy button).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setCanCopy(canCopyImages());
  }, []);

  // Hydrate from a shared link (#s=…) on first load, then tidy the URL.
  // `decodeShare` returns fully validated/clamped state (see sanitizeShared),
  // so every value here is safe to apply directly.
  useEffect(() => {
    const token = readShareToken();
    if (!token) return;
    const shared = decodeShare(token);
    if (shared) {
      const st = useEditor.getState();
      for (const k of SHARE_KEYS) {
        if (k in shared) st.set(k as keyof typeof st, shared[k] as never);
      }
    }
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  // Scale the preview down to fit the stage (display only — export uses the
  // node's natural size, unaffected by this CSS transform).
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const recompute = () => {
      // Horizontal padding is asymmetric (pl-24 + pr-10) to clear the toolbar.
      const availW = stage.clientWidth - 150;
      const availH = stage.clientHeight - 80;
      const cw = Math.max(canvas.offsetWidth, canvas.scrollWidth);
      const ch = Math.max(canvas.offsetHeight, canvas.scrollHeight);
      if (cw > 0 && ch > 0) {
        setFitScale(Math.min(1, availW / cw, availH / ch));
      }
    };
    const ro = new ResizeObserver(recompute);
    ro.observe(canvas);
    ro.observe(stage);
    recompute();
    return () => ro.disconnect();
  }, [s.mode, s.imageSrc]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const loadImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = await fileToDataUrl(file);
    useEditor.getState().setImage(url);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;
    setBusy(true);
    try {
      await rasterRefreshRef.current?.();
      const opts = {
        scale: s.exportScale,
        transparent: s.background.type === "transparent",
        format: s.exportFormat,
      };
      if (s.exportFormat === "svg") {
        await downloadSvg(canvasRef.current, opts);
      } else {
        await downloadImage(canvasRef.current, opts);
      }
    } catch (e) {
      showToast("Export failed. Try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, [s.exportScale, s.exportFormat, s.background.type, showToast]);

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    setBusy(true);
    try {
      await rasterRefreshRef.current?.();
      await copyImage(canvasRef.current, {
        scale: s.exportScale,
        transparent: s.background.type === "transparent",
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      showToast("Copy failed — your browser may block it.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, [s.exportScale, s.background.type, showToast]);

  const handleShare = useCallback(async () => {
    const st = useEditor.getState();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    for (const k of SHARE_KEYS) payload[k] = st[k as keyof typeof st];
    const url = buildShareUrl(encodeShare(payload));
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      showToast(
        st.imageSrc || st.bgImage
          ? "Link copied ✨ (uploaded images aren't included)"
          : "Shareable link copied ✨"
      );
    } catch {
      // Clipboard blocked — put it in the address bar so it's still copyable.
      history.replaceState(null, "", url);
      showToast("Link ready in the address bar — copy it to share");
    }
  }, [showToast]);

  // Global paste: images anywhere.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "TEXTAREA" || target?.tagName === "INPUT") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            loadImageFile(file);
            showToast("Image pasted ✨");
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadImageFile, showToast]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      const st = useEditor.getState();

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleDownload();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if (mod && e.key.toLowerCase() === "z") {
        // Let text inputs keep their own undo.
        if (typing) return;
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
      } else if (mod && e.key.toLowerCase() === "d") {
        if (typing || !st.selectedId) return;
        e.preventDefault();
        st.duplicateAnnotation(st.selectedId);
      } else if (!typing && !mod && (e.key === "[" || e.key === "]")) {
        if (!st.selectedId) return;
        e.preventDefault();
        if (e.key === "]") st.raiseAnnotation(st.selectedId);
        else st.lowerAnnotation(st.selectedId);
      } else if (!typing && st.selectedId && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        // Snapshot only when starting a fresh nudge (>400ms since the last one),
        // so holding/tapping arrows is one undo step, not dozens.
        const now = Date.now();
        if (now - lastNudgeRef.current > 400) st.beginHistory();
        lastNudgeRef.current = now;
        st.nudgeAnnotation(st.selectedId, dx, dy);
      } else if (!typing && (e.key === "Delete" || e.key === "Backspace")) {
        if (st.selectedId) {
          e.preventDefault();
          st.deleteAnnotation(st.selectedId);
        }
      } else if (e.key === "Escape") {
        st.set("selectedId", null);
        setShowHelp(false);
      } else if (!typing && !mod && e.key === "?") {
        setShowHelp((v) => !v);
      } else if (!typing && !mod && TOOL_BY_KEY[e.key.toLowerCase()]) {
        st.set("tool", TOOL_BY_KEY[e.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDownload, handleCopy]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadImageFile(file);
  };

  const showImageEmpty = s.mode === "image" && !s.imageSrc;

  // Gate render until mounted so the persisted store hydrates without an
  // SSR/client mismatch.
  if (!mounted) {
    return <div className="h-screen bg-bg" />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Toolbar
        onCopy={handleCopy}
        onDownload={handleDownload}
        onShare={handleShare}
        copied={copied}
        linkCopied={linkCopied}
        busy={busy}
        canCopy={canCopy}
      />

      <div className="flex flex-1 min-h-0">
        {/* Stage */}
        <main
          className="relative flex-1 min-w-0 flex flex-col"
          onDragOver={(e) => {
            e.preventDefault();
            if (s.mode === "image") setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
        >
          {!showImageEmpty && <AnnotationTools />}
          {!showImageEmpty && <AnnotationInspector />}
          <div
            ref={stageRef}
            className="flex-1 min-h-0 overflow-hidden flex items-center justify-center py-10 pr-10 pl-24 select-none"
          >
            {showImageEmpty ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 w-[440px] max-w-full h-64 rounded-2xl border-2 border-dashed border-border hover:border-accent/60 bg-panel/40 transition-colors text-muted hover:text-fg"
              >
                <ImagePlus size={40} strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-[15px] font-medium text-fg">Drop an image here</p>
                  <p className="text-[13px] mt-1">or click to upload · paste from clipboard</p>
                </div>
              </button>
            ) : (
              <div
                style={{
                  width: "max-content",
                  transform: `scale(${fitScale})`,
                  transformOrigin: "center",
                  transition: "transform 0.15s ease",
                }}
              >
                <div className="animate-fade-up">
                  <Canvas canvasRef={canvasRef} fitScale={fitScale} rasterRefreshRef={rasterRefreshRef} />
                </div>
              </div>
            )}
          </div>

          {/* Code editor drawer */}
          {s.mode === "code" && (
            <div className="shrink-0 border-t border-border bg-panel">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Your code
                </span>
                <span className="text-[11px] text-muted">
                  Paste code · language auto-detects
                </span>
              </div>
              <textarea
                value={s.code}
                spellCheck={false}
                onChange={(e) => {
                  const val = e.target.value;
                  s.set("code", val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const ta = e.currentTarget;
                    const { selectionStart: a, selectionEnd: b, value } = ta;
                    const next = value.slice(0, a) + "  " + value.slice(b);
                    s.set("code", next);
                    requestAnimationFrame(() => {
                      ta.selectionStart = ta.selectionEnd = a + 2;
                    });
                  }
                }}
                onPaste={(e) => {
                  // Auto-detect language on a full paste into an empty-ish editor.
                  const pasted = e.clipboardData.getData("text");
                  if (pasted && pasted.length > 20) {
                    const guess = guessLanguage(pasted);
                    if (guess && (CODE_LANGS as readonly string[]).includes(guess)) {
                      setTimeout(() => s.set("codeLang", guess as (typeof CODE_LANGS)[number]), 0);
                    }
                  }
                }}
                className="w-full h-36 resize-none bg-transparent px-4 pb-4 font-mono text-[13px] leading-relaxed text-fg/90 outline-none placeholder:text-muted"
                placeholder="Paste or type your code here…"
              />
            </div>
          )}

          {/* Drag overlay */}
          {dragActive && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-accent/10 backdrop-blur-sm border-2 border-dashed border-accent m-3 rounded-2xl pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-accent">
                <Upload size={36} />
                <p className="font-semibold">Drop to add image</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadImageFile(file);
              e.target.value = "";
            }}
          />
        </main>

        <Sidebar />
      </div>

      {/* Help button */}
      <button
        onClick={() => setShowHelp(true)}
        title="Keyboard shortcuts (?)"
        className="fixed bottom-4 left-4 z-40 grid place-items-center w-9 h-9 rounded-full bg-panel border border-border text-muted hover:text-fg hover:border-border-hover transition-colors"
      >
        <Keyboard size={16} />
      </button>

      {showHelp && <ShortcutsModal onClose={() => setShowHelp(false)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-panel-2 border border-border text-[13px] shadow-xl animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
