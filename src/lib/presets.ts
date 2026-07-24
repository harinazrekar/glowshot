import type { AspectRatio, Background, CodeTheme, ShadowId } from "./types";

/**
 * Curated, tasteful backgrounds. These are the single biggest driver of a
 * "wow" export, so they are hand-tuned rather than random.
 */
export const GRADIENTS: Background[] = [
  { id: "sunset", name: "Sunset", type: "gradient", css: "linear-gradient(135deg, #ff8a00 0%, #e52e71 100%)" },
  { id: "candy", name: "Candy", type: "gradient", css: "linear-gradient(135deg, #ff6ec4 0%, #7873f5 100%)" },
  { id: "ocean", name: "Ocean", type: "gradient", css: "linear-gradient(135deg, #2af598 0%, #009efd 100%)" },
  { id: "violet", name: "Violet", type: "gradient", css: "linear-gradient(135deg, #a960ee 0%, #90e0ff 100%)" },
  { id: "ember", name: "Ember", type: "gradient", css: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)" },
  { id: "grape", name: "Grape", type: "gradient", css: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)" },
  { id: "peach", name: "Peach", type: "gradient", css: "linear-gradient(135deg, #ffd3a5 0%, #fd6585 100%)" },
  { id: "mint", name: "Mint", type: "gradient", css: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { id: "midnight", name: "Midnight", type: "gradient", css: "linear-gradient(135deg, #232526 0%, #414345 100%)" },
  { id: "aurora", name: "Aurora", type: "gradient", css: "linear-gradient(135deg, #00c6ff 0%, #0072ff 50%, #8e2de2 100%)" },
  { id: "flamingo", name: "Flamingo", type: "gradient", css: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)" },
  { id: "lime", name: "Lime", type: "gradient", css: "linear-gradient(135deg, #b3ffab 0%, #12fff7 100%)" },
  { id: "royal", name: "Royal", type: "gradient", css: "linear-gradient(135deg, #141e30 0%, #243b55 100%)" },
  { id: "coral", name: "Coral", type: "gradient", css: "linear-gradient(135deg, #ff9a8b 0%, #ff6a88 55%, #ff99ac 100%)" },
  { id: "sky", name: "Sky", type: "gradient", css: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { id: "plum", name: "Plum", type: "gradient", css: "linear-gradient(135deg, #b224ef 0%, #7579ff 100%)" },
];

export const MESHES: Background[] = [
  {
    id: "mesh-dawn",
    name: "Dawn",
    type: "mesh",
    css: "radial-gradient(at 0% 0%, #ff9a9e 0px, transparent 55%), radial-gradient(at 100% 0%, #fecfef 0px, transparent 55%), radial-gradient(at 100% 100%, #a18cd1 0px, transparent 55%), radial-gradient(at 0% 100%, #fbc2eb 0px, transparent 55%), #fda085",
  },
  {
    id: "mesh-nebula",
    name: "Nebula",
    type: "mesh",
    css: "radial-gradient(at 10% 20%, #7028e4 0px, transparent 50%), radial-gradient(at 80% 0%, #e5b2ca 0px, transparent 50%), radial-gradient(at 80% 100%, #00c9ff 0px, transparent 50%), radial-gradient(at 0% 100%, #4a00e0 0px, transparent 50%), #1a1a2e",
  },
  {
    id: "mesh-lagoon",
    name: "Lagoon",
    type: "mesh",
    css: "radial-gradient(at 0% 0%, #00d2ff 0px, transparent 50%), radial-gradient(at 100% 30%, #3a7bd5 0px, transparent 50%), radial-gradient(at 50% 100%, #00d2ff 0px, transparent 50%), #0f2027",
  },
  {
    id: "mesh-blossom",
    name: "Blossom",
    type: "mesh",
    css: "radial-gradient(at 20% 10%, #ffdde1 0px, transparent 50%), radial-gradient(at 90% 20%, #ee9ca7 0px, transparent 50%), radial-gradient(at 50% 90%, #ffc3a0 0px, transparent 50%), #ffdde1",
  },
  {
    id: "mesh-cosmos",
    name: "Cosmos",
    type: "mesh",
    css: "radial-gradient(at 0% 0%, #4776e6 0px, transparent 50%), radial-gradient(at 100% 0%, #8e54e9 0px, transparent 50%), radial-gradient(at 50% 100%, #ff6ec4 0px, transparent 50%), #16213e",
  },
  {
    id: "mesh-citrus",
    name: "Citrus",
    type: "mesh",
    css: "radial-gradient(at 0% 20%, #f6d365 0px, transparent 50%), radial-gradient(at 100% 0%, #fda085 0px, transparent 50%), radial-gradient(at 50% 100%, #ff9966 0px, transparent 50%), #f6d365",
  },
  {
    id: "mesh-aurora",
    name: "Aurora",
    type: "mesh",
    css: "radial-gradient(at 10% 10%, #00dbde 0px, transparent 50%), radial-gradient(at 90% 20%, #fc00ff 0px, transparent 50%), radial-gradient(at 40% 100%, #00c9ff 0px, transparent 50%), #16213e",
  },
  {
    id: "mesh-ember",
    name: "Ember",
    type: "mesh",
    css: "radial-gradient(at 20% 0%, #ff512f 0px, transparent 50%), radial-gradient(at 90% 40%, #dd2476 0px, transparent 50%), radial-gradient(at 40% 100%, #ff8008 0px, transparent 50%), #200122",
  },
];

export const SOLIDS: Background[] = [
  { id: "solid-slate", name: "Slate", type: "solid", css: "#1e293b" },
  { id: "solid-ink", name: "Ink", type: "solid", css: "#0f172a" },
  { id: "solid-paper", name: "Paper", type: "solid", css: "#f8fafc" },
  { id: "solid-sand", name: "Sand", type: "solid", css: "#f5f0e8" },
  { id: "solid-blush", name: "Blush", type: "solid", css: "#fde2e4" },
  { id: "solid-forest", name: "Forest", type: "solid", css: "#14532d" },
];

export const TRANSPARENT: Background = {
  id: "transparent",
  name: "None",
  type: "transparent",
  css: "",
};

export const ALL_BACKGROUNDS = [...GRADIENTS, ...MESHES, ...SOLIDS, TRANSPARENT];

export const SHADOWS: { id: ShadowId; label: string; css: string }[] = [
  { id: "none", label: "None", css: "none" },
  { id: "sm", label: "Soft", css: "0 8px 20px -8px rgba(0,0,0,0.35)" },
  { id: "md", label: "Medium", css: "0 20px 40px -12px rgba(0,0,0,0.45)" },
  { id: "lg", label: "Large", css: "0 30px 60px -12px rgba(0,0,0,0.55)" },
  { id: "xl", label: "Dramatic", css: "0 45px 90px -20px rgba(0,0,0,0.65)" },
  { id: "glow", label: "Glow", css: "0 0 0 1px rgba(255,255,255,0.06), 0 30px 70px -15px rgba(0,0,0,0.55), 0 0 90px -20px rgba(120,120,255,0.5)" },
];

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: "auto", label: "Auto", ratio: null },
  { id: "1-1", label: "1:1", ratio: 1 },
  { id: "4-3", label: "4:3", ratio: 4 / 3 },
  { id: "3-2", label: "3:2", ratio: 3 / 2 },
  { id: "16-9", label: "16:9", ratio: 16 / 9 },
  { id: "2-1", label: "2:1", ratio: 2 },
  { id: "9-16", label: "9:16", ratio: 9 / 16 },
];

export const CODE_THEMES: CodeTheme[] = [
  { id: "github-dark", label: "GitHub Dark" },
  { id: "github-light", label: "GitHub Light", light: true },
  { id: "dracula", label: "Dracula" },
  { id: "nord", label: "Nord" },
  { id: "one-dark-pro", label: "One Dark Pro" },
  { id: "vitesse-dark", label: "Vitesse Dark" },
  { id: "catppuccin-mocha", label: "Catppuccin" },
  { id: "monokai", label: "Monokai" },
];

/**
 * Coding fonts. Each `css` value points at a CSS variable wired up in the root
 * layout via next/font, so everything stays bundled — no runtime font fetch.
 */
export const CODE_FONTS: { id: string; label: string; css: string }[] = [
  { id: "jetbrains", label: "JetBrains Mono", css: "var(--font-mono)" },
  { id: "fira", label: "Fira Code", css: "var(--font-fira)" },
  { id: "plex", label: "IBM Plex Mono", css: "var(--font-plex)" },
];

export const CODE_LANGS = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "python",
  "rust",
  "go",
  "java",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "html",
  "css",
  "json",
  "yaml",
  "bash",
  "sql",
  "markdown",
] as const;

export type CodeLang = (typeof CODE_LANGS)[number];

export const SAMPLE_CODE = `// Welcome to Glowshot ✨
// Paste your own code or drop a screenshot.

async function fetchStars(repo: string) {
  const res = await fetch(\`https://api.github.com/repos/\${repo}\`);
  const { stargazers_count } = await res.json();
  return stargazers_count;
}

const stars = await fetchStars("your/awesome-project");
console.log(\`⭐ \${stars.toLocaleString()} and climbing\`);
`;
