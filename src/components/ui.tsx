"use client";

import { useId } from "react";

/** Square icon button used by the annotation rail and the inspector. */
export function IconButton({
  active,
  disabled,
  title,
  onClick,
  size = "md",
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`${size === "sm" ? "w-8 h-8" : "w-9 h-9"} grid place-items-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? "bg-accent text-white" : "text-muted hover:text-fg hover:bg-white/8"
      }`}
    >
      {children}
    </button>
  );
}

/** A colored swatch that opens the native color picker on click. */
export function ColorSwatchInput({
  value,
  onChange,
  title,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  title: string;
  className?: string;
}) {
  return (
    <label
      title={title}
      className={`relative overflow-hidden cursor-pointer ${className}`}
      style={{ background: value }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
      />
    </label>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="text-[13px] text-fg/80">
          {label}
        </label>
        <span className="text-[12px] tabular-nums text-muted">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-panel-2 border border-border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
            value === o.value
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:text-fg hover:bg-white/5"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="block text-[13px] text-fg/80 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg bg-panel-2 border border-border hover:border-border-hover px-3 py-2 text-[13px] text-fg outline-none focus:border-accent transition-colors cursor-pointer"
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full group"
    >
      <span className="text-[13px] text-fg/80">{label}</span>
      <span
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}
