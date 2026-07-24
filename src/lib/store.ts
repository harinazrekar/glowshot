import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Annotation,
  Background,
  ExportFormat,
  FrameStyle,
  FrameTheme,
  GradStop,
  GradType,
  InputMode,
  ShadowId,
  Tool,
} from "./types";
import { GRADIENTS, SAMPLE_CODE, type CodeLang } from "./presets";
import { buildGradientCss } from "./gradient";
import { uid } from "./util";

interface EditorState {
  mode: InputMode;

  // Image
  imageSrc: string | null;

  // Code
  code: string;
  codeLang: CodeLang;
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

  // Frame / canvas
  frame: FrameStyle;
  frameTheme: FrameTheme;
  hideControls: boolean;
  background: Background;
  bgImage: string | null; // custom uploaded background image (dataURL)
  // Custom-gradient editor state (seeds the editor; the generated css lives on `background`)
  gradType: GradType;
  gradAngle: number;
  gradStops: GradStop[];
  padding: number;
  radius: number;
  shadow: ShadowId;
  aspectRatio: string;
  watermark: boolean;
  exportScale: 2 | 3;
  exportFormat: ExportFormat;

  // Effects
  tiltX: number; // deg
  tiltY: number; // deg
  noise: boolean;
  borderWidth: number;
  borderColor: string;

  // Annotations
  annotations: Annotation[];
  tool: Tool;
  annColor: string;
  annWidth: number;
  annFontSize: number;
  annBg: boolean;
  selectedId: string | null;
  past: Annotation[][];
  future: Annotation[][];

  // actions
  set: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  setImage: (src: string | null) => void;
  toggleLine: (line: number) => void;
  applyGradient: (angle: number, stops: GradStop[], type?: GradType) => void;
  reset: () => void;

  // annotation actions
  addAnnotation: (a: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  duplicateAnnotation: (id: string) => void;
  raiseAnnotation: (id: string) => void;
  lowerAnnotation: (id: string) => void;
  nudgeAnnotation: (id: string, dx: number, dy: number) => void;
  clearAnnotations: () => void;
  beginHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const styleDefaults = {
  frame: "mac" as FrameStyle,
  frameTheme: "dark" as FrameTheme,
  hideControls: false,
  background: GRADIENTS[3],
  bgImage: null as string | null,
  gradType: "linear" as GradType,
  gradAngle: 135,
  gradStops: [
    { color: "#a960ee", pos: 0 },
    { color: "#90e0ff", pos: 100 },
  ] as GradStop[],
  padding: 64,
  radius: 12,
  shadow: "lg" as ShadowId,
  aspectRatio: "auto",
  watermark: true,
  exportScale: 2 as 2 | 3,
  exportFormat: "png" as ExportFormat,
  tiltX: 0,
  tiltY: 0,
  noise: false,
  borderWidth: 0,
  borderColor: "#ffffff",
  codeLang: "typescript" as CodeLang,
  codeTheme: "one-dark-pro",
  codeFont: "jetbrains",
  ligatures: true,
  wrap: false,
  showLineNumbers: true,
  codeFontSize: 14,
  dimUnfocused: true,
  diff: false,
};

const initial = {
  mode: "code" as InputMode,
  imageSrc: null as string | null,
  code: SAMPLE_CODE,
  highlightedLines: [] as number[],
  windowTitle: "glowshot.ts",
  ...styleDefaults,
  annotations: [] as Annotation[],
  tool: "select" as Tool,
  annColor: "#ff3b6b",
  annWidth: 4,
  annFontSize: 20,
  annBg: false,
  selectedId: null as string | null,
  past: [] as Annotation[][],
  future: [] as Annotation[][],
};

const HISTORY_LIMIT = 60;

/** Push the current annotations onto the undo stack and clear redo. */
const snapshot = (state: { annotations: Annotation[]; past: Annotation[][] }) => ({
  past: [...state.past.slice(-HISTORY_LIMIT), state.annotations],
  future: [] as Annotation[][],
});

/** Move the annotation with `id` one step toward the front (+1) or back (-1). */
const reorder = (list: Annotation[], id: string, dir: 1 | -1): Annotation[] => {
  const i = list.findIndex((a) => a.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export const useEditor = create<EditorState>()(
  persist(
    (set, get) => ({
      ...initial,
      set: (key, value) => set({ [key]: value } as Partial<EditorState>),
      setImage: (src) => set({ imageSrc: src, mode: src ? "image" : "code" }),
      toggleLine: (line) => {
        const cur = get().highlightedLines;
        set({
          highlightedLines: cur.includes(line)
            ? cur.filter((n) => n !== line)
            : [...cur, line].sort((a, b) => a - b),
        });
      },
      applyGradient: (angle, stops, type) => {
        const t = type ?? get().gradType;
        set({
          gradType: t,
          gradAngle: angle,
          gradStops: stops,
          background: {
            id: "custom-gradient",
            name: "Custom",
            type: "gradient",
            css: buildGradientCss(t, angle, stops),
          },
          bgImage: null,
        });
      },
      reset: () => set({ ...initial }),

      beginHistory: () => set(snapshot(get())),
      addAnnotation: (a) => {
        const st = get();
        set({
          ...snapshot(st),
          annotations: [...st.annotations, a],
          selectedId: a.id,
        });
      },
      updateAnnotation: (id, patch) => {
        set({
          annotations: get().annotations.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        });
      },
      deleteAnnotation: (id) => {
        const st = get();
        set({
          ...snapshot(st),
          annotations: st.annotations.filter((a) => a.id !== id),
          selectedId: null,
        });
      },
      duplicateAnnotation: (id) => {
        const st = get();
        const src = st.annotations.find((a) => a.id === id);
        if (!src) return;
        const copy: Annotation = {
          ...src,
          id: uid(),
          x: src.x + 16,
          y: src.y + 16,
          points: src.points?.map((p) => ({ x: p.x + 16, y: p.y + 16 })),
        };
        set({
          ...snapshot(st),
          annotations: [...st.annotations, copy],
          selectedId: copy.id,
        });
      },
      raiseAnnotation: (id) => {
        const next = reorder(get().annotations, id, 1);
        if (next !== get().annotations) set({ annotations: next });
      },
      lowerAnnotation: (id) => {
        const next = reorder(get().annotations, id, -1);
        if (next !== get().annotations) set({ annotations: next });
      },
      nudgeAnnotation: (id, dx, dy) => {
        set({
          annotations: get().annotations.map((a) =>
            a.id === id
              ? {
                  ...a,
                  x: a.x + dx,
                  y: a.y + dy,
                  points: a.points?.map((p) => ({ x: p.x + dx, y: p.y + dy })),
                }
              : a
          ),
        });
      },
      clearAnnotations: () => {
        const st = get();
        if (st.annotations.length === 0) return;
        set({ ...snapshot(st), annotations: [], selectedId: null });
      },
      undo: () => {
        const { past, future, annotations } = get();
        if (past.length === 0) return;
        const prev = past[past.length - 1];
        set({
          past: past.slice(0, -1),
          future: [annotations, ...future],
          annotations: prev,
          selectedId: null,
        });
      },
      redo: () => {
        const { past, future, annotations } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
          past: [...past, annotations],
          future: future.slice(1),
          annotations: next,
          selectedId: null,
        });
      },
    }),
    {
      name: "glowshot-style",
      storage: createJSONStorage(() => localStorage),
      // Persist only the "look" — never content, annotations, or transient tool state.
      partialize: (s) => ({
        frame: s.frame,
        frameTheme: s.frameTheme,
        background: s.background,
        gradType: s.gradType,
        gradAngle: s.gradAngle,
        gradStops: s.gradStops,
        padding: s.padding,
        radius: s.radius,
        shadow: s.shadow,
        aspectRatio: s.aspectRatio,
        watermark: s.watermark,
        exportScale: s.exportScale,
        exportFormat: s.exportFormat,
        codeFontSize: s.codeFontSize,
        tiltX: s.tiltX,
        tiltY: s.tiltY,
        noise: s.noise,
        borderWidth: s.borderWidth,
        borderColor: s.borderColor,
        codeTheme: s.codeTheme,
        codeFont: s.codeFont,
        ligatures: s.ligatures,
        wrap: s.wrap,
        dimUnfocused: s.dimUnfocused,
        showLineNumbers: s.showLineNumbers,
        hideControls: s.hideControls,
        annColor: s.annColor,
        annWidth: s.annWidth,
        annFontSize: s.annFontSize,
        annBg: s.annBg,
      }),
    }
  )
);

/** Preset "looks" — one click sets a whole coordinated style. */
export interface PresetLook {
  id: string;
  name: string;
  apply: Partial<EditorState>;
}

export const PRESET_LOOKS: PresetLook[] = [
  {
    id: "clean",
    name: "Clean",
    apply: { background: GRADIENTS[3], padding: 64, radius: 12, shadow: "lg", tiltX: 0, tiltY: 0, noise: false, borderWidth: 0, frame: "mac" },
  },
  {
    id: "punch",
    name: "Punchy",
    apply: { background: GRADIENTS[0], padding: 80, radius: 16, shadow: "xl", tiltX: 0, tiltY: 0, noise: true, borderWidth: 0, frame: "mac" },
  },
  {
    id: "tilt",
    name: "3D Tilt",
    apply: { background: GRADIENTS[5], padding: 96, radius: 14, shadow: "xl", tiltX: 8, tiltY: -14, noise: false, borderWidth: 0, frame: "mac" },
  },
  {
    id: "glow",
    name: "Neon",
    apply: { background: GRADIENTS[9], padding: 88, radius: 14, shadow: "glow", tiltX: 0, tiltY: 0, noise: true, borderWidth: 1, borderColor: "#8e8eff", frame: "mac" },
  },
];
