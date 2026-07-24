import { test } from "node:test";
import assert from "node:assert/strict";
import { formatLines, parseLines } from "../src/lib/lines.ts";

test("parseLines expands ranges and singles", () => {
  assert.deepEqual(parseLines("2, 5-8"), [2, 5, 6, 7, 8]);
});

test("parseLines dedupes, sorts, and ignores non-positive / junk", () => {
  assert.deepEqual(parseLines("9, 3, 3, 0, -4, foo, 1"), [1, 3, 9]);
});

test("parseLines accepts reversed ranges", () => {
  assert.deepEqual(parseLines("8-5"), [5, 6, 7, 8]);
});

test("parseLines on empty / whitespace is empty", () => {
  assert.deepEqual(parseLines(""), []);
  assert.deepEqual(parseLines("  ,  , "), []);
});

test("formatLines collapses runs into ranges", () => {
  assert.equal(formatLines([2, 5, 6, 7, 8]), "2, 5-8");
  assert.equal(formatLines([1]), "1");
  assert.equal(formatLines([1, 3, 5]), "1, 3, 5");
});

test("parseLines <-> formatLines round-trips", () => {
  for (const s of ["1", "2, 5-8", "1-3, 7, 10-12"]) {
    assert.equal(formatLines(parseLines(s)), s);
  }
});
