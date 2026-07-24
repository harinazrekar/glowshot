import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeShare, encodeShare, sanitizeShared } from "../src/lib/share.ts";
import { GRADIENTS } from "../src/lib/presets.ts";

/* ---- SEC-01: the crash payloads must be neutralized ---- */

test("wrong-typed annotations are dropped (no crash payload survives)", () => {
  // {"annotations":5} was the confirmed crash token — Canvas calls .some on it.
  assert.equal("annotations" in sanitizeShared({ annotations: 5 }), false);
  assert.equal("annotations" in sanitizeShared({ annotations: "x" }), false);
});

test("gradStops with <2 valid entries are dropped (no addStop crash)", () => {
  assert.equal("gradStops" in sanitizeShared({ gradStops: [] }), false);
  assert.equal("gradStops" in sanitizeShared({ gradStops: [{ color: "#fff", pos: 0 }] }), false);
});

test("a valid annotation is kept and normalized", () => {
  const out = sanitizeShared({
    annotations: [
      { id: "a1", type: "box", x: 1, y: 2, w: 3, h: 4, color: "#ff0000", strokeWidth: 4 },
    ],
  });
  assert.equal(out.annotations?.length, 1);
  assert.equal(out.annotations?.[0].type, "box");
});

test("annotations with unsafe color or unknown type are dropped element-wise", () => {
  const out = sanitizeShared({
    annotations: [
      { type: "box", x: 0, y: 0, w: 1, h: 1, color: "url(https://evil/x)", strokeWidth: 2 },
      { type: "not-a-tool", x: 0, y: 0, w: 1, h: 1, color: "#fff", strokeWidth: 2 },
      { type: "arrow", x: 0, y: 0, w: 1, h: 1, color: "#fff", strokeWidth: 2 },
    ],
  });
  assert.equal(out.annotations?.length, 1);
  assert.equal(out.annotations?.[0].type, "arrow");
});

/* ---- SEC-01: the beacon / CSS-injection vector must be blocked ---- */

test("a custom background with url() CSS is rejected", () => {
  const out = sanitizeShared({
    background: { id: "x", name: "x", type: "solid", css: "url(https://attacker.example/beacon.png)" },
  });
  assert.equal("background" in out, false);
});

test("a custom solid with a safe hex color is kept", () => {
  const out = sanitizeShared({
    background: { id: "x", name: "x", type: "solid", css: "#123abc" },
  });
  assert.deepEqual(out.background, { id: "custom", name: "Custom", type: "solid", css: "#123abc" });
});

test("a known preset background resolves to its canonical object", () => {
  const violet = GRADIENTS.find((g) => g.id === "violet")!;
  // Even with a tampered css, the id wins and the canonical preset is used.
  const out = sanitizeShared({
    background: { id: "violet", name: "evil", type: "gradient", css: "url(https://evil/x)" },
  });
  assert.deepEqual(out.background, violet);
});

test("a custom gradient rebuilds its CSS from sanitized primitives", () => {
  const out = sanitizeShared({
    background: { id: "custom-gradient", name: "Custom", type: "gradient", css: "url(evil)" },
    gradType: "linear",
    gradAngle: 90,
    gradStops: [
      { color: "#000000", pos: 0 },
      { color: "#ffffff", pos: 100 },
    ],
  });
  assert.equal(out.background?.css, "linear-gradient(90deg, #000000 0%, #ffffff 100%)");
  assert.ok(!out.background?.css.includes("url("));
});

/* ---- SEC-01: whitelists and clamps ---- */

test("invalid enum values are dropped; valid ones kept", () => {
  assert.equal("codeTheme" in sanitizeShared({ codeTheme: "evil-theme" }), false);
  assert.equal(sanitizeShared({ codeTheme: "dracula" }).codeTheme, "dracula");
  assert.equal("frame" in sanitizeShared({ frame: "spaceship" }), false);
});

test("out-of-range numbers are clamped to their control ranges", () => {
  assert.equal(sanitizeShared({ padding: 99999 }).padding, 160);
  assert.equal(sanitizeShared({ padding: -50 }).padding, 0);
  assert.equal(sanitizeShared({ tiltX: -999 }).tiltX, -24);
  assert.equal(sanitizeShared({ codeFontSize: 3 }).codeFontSize, 10);
});

test("NaN / non-finite numbers are dropped, not passed through", () => {
  assert.equal("gradAngle" in sanitizeShared({ gradAngle: NaN }), false);
  assert.equal("padding" in sanitizeShared({ padding: Infinity }), false);
});

test("highlightedLines keep only positive integers", () => {
  assert.deepEqual(sanitizeShared({ highlightedLines: [1, 2.5, -3, 0, 4] }).highlightedLines, [1, 4]);
  assert.equal("highlightedLines" in sanitizeShared({ highlightedLines: 5 }), false);
});

/* ---- decode/encode round-trip ---- */

test("decodeShare returns null on malformed tokens", () => {
  assert.equal(decodeShare("!!!not-base64!!!"), null);
});

test("encode -> decode preserves valid state and strips injected junk", () => {
  const token = encodeShare({
    padding: 40,
    codeTheme: "nord",
    // @ts-expect-error deliberately smuggling an invalid field/value
    annotations: 5,
  });
  const decoded = decodeShare(token);
  assert.ok(decoded);
  assert.equal(decoded.padding, 40);
  assert.equal(decoded.codeTheme, "nord");
  assert.equal("annotations" in decoded, false);
});

test("non-object input yields an empty object", () => {
  assert.deepEqual(sanitizeShared(null), {});
  assert.deepEqual(sanitizeShared(42), {});
  assert.deepEqual(sanitizeShared([1, 2, 3]), {});
});
