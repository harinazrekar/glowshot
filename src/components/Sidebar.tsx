"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Code2, ImagePlus, Plus, RotateCcw, Shuffle, Trash2, X } from "lucide-react";
import { useEditor, PRESET_LOOKS } from "@/lib/store";
import { fileToDataUrl } from "@/lib/util";
import { canCopyText, copyDataUri } from "@/lib/export";
import { buildGradientCss, parseLinearGradient } from "@/lib/gradient";
import { formatLines, parseLines } from "@/lib/lines";
import {
  ASPECT_RATIOS,
  CODE_FONTS,
  CODE_LANGS,
  CODE_THEMES,
  GRADIENTS,
  MESHES,
  SHADOWS,
  SOLIDS,
  TRANSPARENT,
} from "@/lib/presets";
import type { Background, ExportFormat, FrameStyle, FrameTheme, GradStop, GradType, ShadowId } from "@/lib/types";
import { Field, Section, Segmented, Select, Slider, Toggle } from "./ui";

function Swatch({
  bg,
  active,
  onClick,
}: {
  bg: Background;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={bg.name}
      onClick={onClick}
      className={`h-9 rounded-lg border transition-all ${
        active
          ? "border-accent ring-2 ring-accent/40 scale-105"
          : "border-white/10 hover:border-white/30"
      } ${bg.type === "transparent" ? "checkerboard" : ""}`}
      style={
        bg.type === "transparent"
          ? undefined
          : { background: bg.css, backgroundColor: bg.type === "solid" ? bg.css : undefined }
      }
    />
  );
}

function SwatchGrid({ items }: { items: Background[] }) {
  const { background, set } = useEditor();
  return (
    <div className="grid grid-cols-5 gap-2">
      {items.map((bg) => (
        <Swatch
          key={bg.id}
          bg={bg}
          active={background.id === bg.id}
          onClick={() => {
            set("background", bg);
            // Seed the custom-gradient editor so its angle/colors can be tweaked.
            if (bg.type === "gradient") {
              const parsed = parseLinearGradient(bg.css);
              if (parsed) {
                set("gradAngle", parsed.angle);
                set("gradStops", parsed.stops);
              }
            }
          }}
        />
      ))}
    </div>
  );
}

/** Angle + multi-stop editor for a fully custom gradient. */
function GradientEditor() {
  const s = useEditor();
  const stops = s.gradStops;
  const active = s.background.id === "custom-gradient";

  const setAngle = (angle: number) => s.applyGradient(angle, stops);
  const setType = (type: GradType) => s.applyGradient(s.gradAngle, stops, type);
  const patchStop = (i: number, patch: Partial<GradStop>) =>
    s.applyGradient(
      s.gradAngle,
      stops.map((st, idx) => (idx === i ? { ...st, ...patch } : st))
    );
  const addStop = () => {
    if (stops.length >= 5) return;
    const sorted = [...stops].sort((a, b) => a.pos - b.pos);
    const mid = Math.round((sorted[sorted.length - 1].pos + sorted[sorted.length - 2].pos) / 2);
    s.applyGradient(s.gradAngle, [...stops, { color: sorted[sorted.length - 1].color, pos: mid }]);
  };
  const removeStop = (i: number) => {
    if (stops.length <= 2) return;
    s.applyGradient(s.gradAngle, stops.filter((_, idx) => idx !== i));
  };

  return (
    <div className={`rounded-xl border p-3 ${active ? "border-accent/60" : "border-border"}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Custom gradient
        </span>
        <button
          onClick={() => s.applyGradient(s.gradAngle, stops)}
          className={`text-[11px] ${active ? "text-accent" : "text-muted hover:text-fg"}`}
        >
          {active ? "Active" : "Use"}
        </button>
      </div>

      {/* Live preview */}
      <div
        className="h-9 rounded-lg border border-white/10 mb-3"
        style={{ background: buildGradientCss(s.gradType, s.gradAngle, stops) }}
      />

      <div className="mb-3">
        <Segmented<GradType>
          value={s.gradType}
          onChange={setType}
          options={[
            { value: "linear", label: "Linear" },
            { value: "radial", label: "Radial" },
            { value: "conic", label: "Conic" },
          ]}
        />
      </div>

      {s.gradType !== "radial" && (
        <Slider
          label={s.gradType === "conic" ? "Start angle" : "Angle"}
          value={s.gradAngle}
          min={0}
          max={360}
          unit="°"
          onChange={setAngle}
        />
      )}

      <div className="space-y-2 mt-1">
        {stops.map((st, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={st.color}
              onChange={(e) => patchStop(i, { color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer bg-transparent shrink-0"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(st.pos)}
              onChange={(e) => patchStop(i, { pos: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[11px] tabular-nums text-muted w-9 text-right">
              {Math.round(st.pos)}%
            </span>
            {stops.length > 2 && (
              <button
                title="Remove stop"
                onClick={() => removeStop(i)}
                className="grid place-items-center w-5 h-5 rounded text-muted hover:text-red-400 shrink-0"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {stops.length < 5 && (
        <button
          onClick={addStop}
          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-panel-2 border border-border hover:border-border-hover px-3 py-1.5 text-[12px] font-medium text-fg/80 hover:text-fg transition-colors"
        >
          <Plus size={13} /> Add color stop
        </button>
      )}
    </div>
  );
}

/** Text input that stays in sync with clicks on lines in the preview. */
function FocusLinesInput() {
  const { highlightedLines, set } = useEditor();
  const [text, setText] = useState(() => formatLines(highlightedLines));

  // Reflect gutter clicks made in the preview, without clobbering mid-typing.
  useEffect(() => {
    const canonical = formatLines(highlightedLines);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (parseLines(text).join(",") !== highlightedLines.join(",")) setText(canonical);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedLines]);

  return (
    <input
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        set("highlightedLines", parseLines(e.target.value));
      }}
      placeholder="e.g. 2, 5-8"
      className="w-full rounded-lg bg-panel-2 border border-border hover:border-border-hover focus:border-accent px-3 py-2 text-[13px] outline-none transition-colors"
    />
  );
}

export function Sidebar() {
  const s = useEditor();
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [copiedUri, setCopiedUri] = useState(false);

  return (
    <aside className="w-[300px] shrink-0 h-full overflow-y-auto bg-panel border-l border-border">
      {/* Preset looks */}
      <Section title="Presets">
        <div className="grid grid-cols-4 gap-1.5">
          {PRESET_LOOKS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                Object.entries(p.apply).forEach(([k, v]) =>
                  s.set(k as never, v as never)
                );
              }}
              className="px-2 py-2 rounded-lg text-[12px] font-medium bg-panel-2 border border-border text-muted hover:text-fg hover:border-border-hover transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const gradients = [...GRADIENTS, ...MESHES];
            const bg = gradients[Math.floor(Math.random() * gradients.length)];
            const shadows: ShadowId[] = ["md", "lg", "xl", "glow"];
            s.set("background", bg);
            s.set("shadow", shadows[Math.floor(Math.random() * shadows.length)]);
            s.set("padding", 48 + Math.floor(Math.random() * 8) * 8);
            s.set("bgImage", null);
          }}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-panel-2 border border-border hover:border-border-hover px-3 py-2 text-[12.5px] font-medium text-fg/80 hover:text-fg transition-colors"
        >
          <Shuffle size={14} /> Randomize
        </button>
      </Section>

      {/* Background */}
      <Section title="Background">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-muted mb-1.5">Gradient</p>
            <SwatchGrid items={GRADIENTS} />
          </div>
          <div>
            <p className="text-[11px] text-muted mb-1.5">Mesh</p>
            <SwatchGrid items={[...MESHES, TRANSPARENT]} />
          </div>
          <div>
            <p className="text-[11px] text-muted mb-1.5">Solid</p>
            <SwatchGrid items={SOLIDS} />
          </div>
          <GradientEditor />
          <div className="flex items-center gap-2">
            <button
              onClick={() => bgFileRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-panel-2 border border-border hover:border-border-hover px-3 py-2 text-[13px] text-fg/80 hover:text-fg transition-colors"
            >
              <ImagePlus size={14} /> {s.bgImage ? "Change image" : "Upload image"}
            </button>
            {s.bgImage && (
              <button
                title="Remove background image"
                onClick={() => s.set("bgImage", null)}
                className="grid place-items-center w-9 h-9 rounded-lg bg-panel-2 border border-border text-muted hover:text-fg"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <input
              ref={bgFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) s.set("bgImage", await fileToDataUrl(f));
                e.target.value = "";
              }}
            />
          </div>
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <span className="text-[13px] text-fg/80">Custom color</span>
            <input
              type="color"
              className="ml-auto w-8 h-6 rounded cursor-pointer bg-transparent"
              onChange={(e) =>
                s.set("background", {
                  id: "custom",
                  name: "Custom",
                  type: "solid",
                  css: e.target.value,
                })
              }
            />
          </label>
        </div>
      </Section>

      {/* Frame */}
      <Section title="Window">
        <Field label="Frame">
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { value: "none", label: "None" },
                { value: "mac", label: "macOS" },
                { value: "browser", label: "Browser" },
                { value: "windows", label: "Windows" },
              ] as { value: FrameStyle; label: string }[]
            ).map((o) => (
              <button
                key={o.value}
                onClick={() => s.set("frame", o.value)}
                className={`px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  s.frame === o.value
                    ? "bg-accent text-white"
                    : "bg-panel-2 text-muted hover:text-fg border border-border"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Theme">
          <Segmented<FrameTheme>
            value={s.frameTheme}
            onChange={(v) => s.set("frameTheme", v)}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </Field>
        <Field label={s.frame === "browser" ? "URL" : "Title"}>
          <input
            value={s.windowTitle}
            onChange={(e) => s.set("windowTitle", e.target.value)}
            placeholder={s.frame === "browser" ? "example.com" : "filename.ts"}
            className="w-full rounded-lg bg-panel-2 border border-border hover:border-border-hover focus:border-accent px-3 py-2 text-[13px] outline-none transition-colors"
          />
        </Field>
        {s.frame !== "none" && s.frame !== "browser" && (
          <div className="mt-1">
            <Toggle
              label="Hide window controls"
              checked={s.hideControls}
              onChange={(v) => s.set("hideControls", v)}
            />
          </div>
        )}
      </Section>

      {/* Style */}
      <Section title="Style">
        <Slider label="Padding" value={s.padding} min={0} max={160} unit="px" onChange={(v) => s.set("padding", v)} />
        <Slider label="Roundness" value={s.radius} min={0} max={32} unit="px" onChange={(v) => s.set("radius", v)} />
        <Field label="Shadow">
          <div className="grid grid-cols-3 gap-1.5">
            {SHADOWS.map((sh) => (
              <button
                key={sh.id}
                onClick={() => s.set("shadow", sh.id as ShadowId)}
                className={`px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  s.shadow === sh.id
                    ? "bg-accent text-white"
                    : "bg-panel-2 text-muted hover:text-fg border border-border"
                }`}
              >
                {sh.label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Effects */}
      <Section
        title="Effects"
        action={
          (s.tiltX !== 0 || s.tiltY !== 0) && (
            <button
              onClick={() => {
                s.set("tiltX", 0);
                s.set("tiltY", 0);
              }}
              className="text-[11px] text-muted hover:text-fg"
            >
              Reset tilt
            </button>
          )
        }
      >
        <Slider label="Tilt ↕" value={s.tiltX} min={-24} max={24} unit="°" onChange={(v) => s.set("tiltX", v)} />
        <Slider label="Tilt ↔" value={s.tiltY} min={-24} max={24} unit="°" onChange={(v) => s.set("tiltY", v)} />
        <Slider label="Border" value={s.borderWidth} min={0} max={12} unit="px" onChange={(v) => s.set("borderWidth", v)} />
        {s.borderWidth > 0 && (
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <span className="text-[13px] text-fg/80">Border color</span>
            <input
              type="color"
              value={s.borderColor}
              className="ml-auto w-8 h-6 rounded cursor-pointer bg-transparent"
              onChange={(e) => s.set("borderColor", e.target.value)}
            />
          </label>
        )}
        <div className="mt-1">
          <Toggle label="Film grain" checked={s.noise} onChange={(v) => s.set("noise", v)} />
        </div>
      </Section>

      {/* Aspect ratio */}
      <Section title="Aspect Ratio">
        <div className="grid grid-cols-4 gap-1.5">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.id}
              onClick={() => s.set("aspectRatio", r.id)}
              className={`px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                s.aspectRatio === r.id
                  ? "bg-accent text-white"
                  : "bg-panel-2 text-muted hover:text-fg border border-border"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Code options */}
      {s.mode === "code" && (
        <Section title="Code">
          <Field label="Language">
            <Select value={s.codeLang} onChange={(v) => s.set("codeLang", v as (typeof CODE_LANGS)[number])}>
              {CODE_LANGS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Theme">
            <Select value={s.codeTheme} onChange={(v) => s.set("codeTheme", v)}>
              {CODE_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Font">
            <Select value={s.codeFont} onChange={(v) => s.set("codeFont", v)}>
              {CODE_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
          <Slider label="Font size" value={s.codeFontSize} min={10} max={24} unit="px" onChange={(v) => s.set("codeFontSize", v)} />
          <div className="space-y-2.5 mt-1">
            <Toggle
              label="Line numbers"
              checked={s.showLineNumbers}
              onChange={(v) => s.set("showLineNumbers", v)}
            />
            <Toggle label="Ligatures" checked={s.ligatures} onChange={(v) => s.set("ligatures", v)} />
            <Toggle label="Wrap long lines" checked={s.wrap} onChange={(v) => s.set("wrap", v)} />
            <Toggle label="Diff view (+ / − lines)" checked={s.diff} onChange={(v) => s.set("diff", v)} />
          </div>

          <div className="mt-4 pt-3.5 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] text-fg/80">Focus lines</label>
              {s.highlightedLines.length > 0 && (
                <button
                  onClick={() => s.set("highlightedLines", [])}
                  className="text-[11px] text-muted hover:text-fg"
                >
                  Clear
                </button>
              )}
            </div>
            <FocusLinesInput />
            <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
              Click a line in the preview, or type ranges. Highlights the lines that matter.
            </p>
            {s.highlightedLines.length > 0 && (
              <div className="mt-2.5">
                <Toggle label="Dim the rest" checked={s.dimUnfocused} onChange={(v) => s.set("dimUnfocused", v)} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Export options */}
      <Section title="Export">
        <Field label="Format">
          <Segmented<string>
            value={s.exportFormat}
            onChange={(v) => s.set("exportFormat", v as ExportFormat)}
            options={[
              { value: "png", label: "PNG" },
              { value: "jpeg", label: "JPEG" },
              { value: "svg", label: "SVG" },
            ]}
          />
        </Field>
        {s.exportFormat !== "svg" && (
          <Field label="Resolution">
            <Segmented<string>
              value={String(s.exportScale)}
              onChange={(v) => s.set("exportScale", Number(v) as 2 | 3)}
              options={[
                { value: "2", label: "2× HD" },
                { value: "3", label: "3× Ultra" },
              ]}
            />
          </Field>
        )}
        {canCopyText() && (
          <button
            onClick={async () => {
              const node = document.getElementById("glow-canvas");
              if (!node) return;
              try {
                await copyDataUri(node as HTMLElement, {
                  scale: s.exportScale,
                  transparent: s.background.type === "transparent",
                });
                setCopiedUri(true);
                setTimeout(() => setCopiedUri(false), 1800);
              } catch {
                /* clipboard may be blocked */
              }
            }}
            className="mb-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-panel-2 border border-border hover:border-border-hover px-3 py-2 text-[12.5px] font-medium text-fg/80 hover:text-fg transition-colors"
          >
            {copiedUri ? (
              <>
                <Check size={14} className="text-green-400" /> Copied data URI
              </>
            ) : (
              <>
                <Code2 size={14} /> Copy as data URI
              </>
            )}
          </button>
        )}
        <div className="mt-1">
          <Toggle
            label="Glowshot badge"
            checked={s.watermark}
            onChange={(v) => s.set("watermark", v)}
          />
          <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
            Keep the badge on to support the project 💜
          </p>
        </div>
      </Section>

      {/* Reset */}
      <div className="p-4">
        <button
          onClick={() => {
            if (confirm("Reset everything — code, style and annotations — to defaults?")) {
              s.reset();
            }
          }}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-panel-2 border border-border hover:border-red-500/50 hover:text-red-400 px-3 py-2 text-[13px] text-muted transition-colors"
        >
          <Trash2 size={14} /> Reset everything
        </button>
      </div>
    </aside>
  );
}
