import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGradientCss, parseLinearGradient } from "../src/lib/gradient.ts";
import { GRADIENTS } from "../src/lib/presets.ts";

test("buildGradientCss sorts stops by position and rounds", () => {
  const css = buildGradientCss(
    "linear",
    135.4,
    [
      { color: "#fff", pos: 100 },
      { color: "#000", pos: 0.2 },
    ]
  );
  assert.equal(css, "linear-gradient(135deg, #000 0%, #fff 100%)");
});

test("buildGradientCss emits radial and conic forms", () => {
  const stops = [
    { color: "#000", pos: 0 },
    { color: "#fff", pos: 100 },
  ];
  assert.equal(
    buildGradientCss("radial", 90, stops),
    "radial-gradient(circle at 50% 50%, #000 0%, #fff 100%)"
  );
  assert.equal(
    buildGradientCss("conic", 90, stops),
    "conic-gradient(from 90deg at 50% 50%, #000 0%, #fff 100%)"
  );
});

test("parseLinearGradient round-trips a two-stop linear gradient", () => {
  const parsed = parseLinearGradient("linear-gradient(135deg, #a960ee 0%, #90e0ff 100%)");
  assert.ok(parsed);
  assert.equal(parsed.angle, 135);
  assert.deepEqual(parsed.stops, [
    { color: "#a960ee", pos: 0 },
    { color: "#90e0ff", pos: 100 },
  ]);
});

test("parseLinearGradient maps directional keywords to angles", () => {
  const parsed = parseLinearGradient("linear-gradient(to right, #000, #fff)");
  assert.ok(parsed);
  assert.equal(parsed.angle, 90);
  // No explicit positions -> distributed evenly across 0..100.
  assert.deepEqual(parsed.stops.map((s) => s.pos), [0, 100]);
});

test("parseLinearGradient returns null for non-linear gradients", () => {
  assert.equal(parseLinearGradient("radial-gradient(circle, #000, #fff)"), null);
  assert.equal(parseLinearGradient("#ff0000"), null);
});

test("every linear GRADIENT preset parses back into >=2 stops", () => {
  for (const g of GRADIENTS) {
    const parsed = parseLinearGradient(g.css);
    assert.ok(parsed, `expected ${g.id} to parse`);
    assert.ok(parsed.stops.length >= 2, `expected ${g.id} to yield >=2 stops`);
  }
});
