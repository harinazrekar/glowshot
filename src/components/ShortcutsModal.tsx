"use client";

import { X } from "lucide-react";
import { ANNOTATION_TOOLS } from "@/lib/annotations";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Export",
    items: [
      ["⌘ / Ctrl + S", "Download PNG"],
      ["⌘ / Ctrl + ⇧ + C", "Copy to clipboard"],
      ["⌘ / Ctrl + V", "Paste an image"],
    ],
  },
  {
    title: "Tools",
    items: ANNOTATION_TOOLS.map((t) => [t.key, t.label] as [string, string]),
  },
  {
    title: "Editing",
    items: [
      ["⌘ / Ctrl + Z", "Undo"],
      ["⌘ / Ctrl + ⇧ + Z", "Redo"],
      ["⌘ / Ctrl + D", "Duplicate selected"],
      ["[  /  ]", "Send back / forward"],
      ["Arrows", "Nudge (⇧ = 10px)"],
      ["Delete / Backspace", "Delete selected"],
      ["Esc", "Deselect"],
      ["?", "Toggle this help"],
    ],
  },
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-panel border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-[15px]">Keyboard shortcuts</h2>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X size={18} />
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 p-5">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2.5">
                {g.title}
              </h3>
              <ul className="space-y-2">
                {g.items.map(([k, v]) => (
                  <li key={k} className="text-[12.5px]">
                    <kbd className="inline-block px-1.5 py-0.5 rounded bg-panel-2 border border-border text-fg/90 text-[11px] font-mono">
                      {k}
                    </kbd>
                    <div className="text-muted mt-1">{v}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
