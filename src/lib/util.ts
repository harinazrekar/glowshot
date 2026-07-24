/** Clamp `v` into the inclusive range [min, max]. */
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

let idCounter = 0;
/** Short, collision-resistant id for annotations. */
export const uid = () => `a${Date.now()}${idCounter++}`;

/** Read a File as a data-URL (used for image + background uploads). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Brand accent gradient, shared by the logo, export button and watermark. */
export const BRAND_GRADIENT = "linear-gradient(135deg,#a960ee,#7c5cff)";
