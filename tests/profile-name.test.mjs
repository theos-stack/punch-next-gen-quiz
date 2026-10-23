import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDisplayName } from "../lib/auth/profile-name.mjs";

test("trims a valid display name before saving", () => {
  assert.equal(normalizeDisplayName("  Samuel Ojo  "), "Samuel Ojo");
});

test("rejects empty, short, long, and non-string display names", () => {
  assert.equal(normalizeDisplayName("  "), null);
  assert.equal(normalizeDisplayName("S"), null);
  assert.equal(normalizeDisplayName("A".repeat(61)), null);
  assert.equal(normalizeDisplayName(null), null);
});

test("rejects control characters in display names", () => {
  assert.equal(normalizeDisplayName("Sam\nuel"), null);
});
