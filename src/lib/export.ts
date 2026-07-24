import { toBlob, toPng, toSvg } from "html-to-image";
import type { ExportFormat } from "./types";

interface ExportOpts {
  scale: 2 | 3;
  transparent: boolean;
  format?: ExportFormat;
}

/**
 * Editor-only chrome (selection handles, outlines) lives inside the export
 * node so it can be positioned in annotation coordinate space. Tag it with
 * this class and drop it at capture time so it never bakes into the image.
 */
const EXCLUDE_CLASS = "glow-no-export";
function keepInExport(node: HTMLElement): boolean {
  return !(node.classList && node.classList.contains(EXCLUDE_CLASS));
}

async function renderBlob(node: HTMLElement, opts: ExportOpts): Promise<Blob> {
  // Render twice: the first pass warms font/image embedding so the second
  // pass is pixel-accurate (a known html-to-image quirk).
  const jpeg = opts.format === "jpeg";
  const options = {
    pixelRatio: opts.scale,
    cacheBust: true,
    filter: keepInExport,
    style: { margin: "0" },
    type: jpeg ? "image/jpeg" : "image/png",
    quality: jpeg ? 0.95 : 1,
    // JPEG has no alpha; give transparent exports a sensible backdrop.
    backgroundColor: jpeg && opts.transparent ? "#0a0a0f" : undefined,
  };
  await toBlob(node, options);
  const blob = await toBlob(node, options);
  if (!blob) throw new Error("Failed to render image");
  return blob;
}

function filename(node: HTMLElement, ext: string) {
  const w = Math.round(node.offsetWidth);
  const h = Math.round(node.offsetHeight);
  return `glowshot-${w}x${h}-${Date.now()}.${ext}`;
}

export async function downloadImage(node: HTMLElement, opts: ExportOpts) {
  const blob = await renderBlob(node, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename(node, opts.format === "jpeg" ? "jpg" : "png");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyImage(node: HTMLElement, opts: ExportOpts) {
  // Clipboard images are always PNG for the widest app compatibility.
  const blob = await renderBlob(node, { ...opts, format: "png" });
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

/** Download a scalable SVG (DOM wrapped in a foreignObject). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function downloadSvg(node: HTMLElement, _opts?: ExportOpts) {
  const options = { cacheBust: true, filter: keepInExport, style: { margin: "0" } };
  // Two passes so fonts/images are embedded before the final capture.
  await toSvg(node, options);
  const dataUrl = await toSvg(node, options);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename(node, "svg");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Copy a base64 PNG data-URI to the clipboard as text — handy for pasting
 * straight into Markdown, CSS `url(...)`, an <img src>, or a design tool.
 */
export async function copyDataUri(node: HTMLElement, opts: ExportOpts) {
  const options = {
    pixelRatio: opts.scale,
    cacheBust: true,
    filter: keepInExport,
    style: { margin: "0" },
  };
  await toPng(node, options);
  const dataUrl = await toPng(node, options);
  await navigator.clipboard.writeText(dataUrl);
}

export function canCopyImages(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof ClipboardItem !== "undefined" &&
    !!navigator.clipboard?.write
  );
}

export function canCopyText(): boolean {
  return typeof navigator !== "undefined" && !!navigator.clipboard?.writeText;
}
