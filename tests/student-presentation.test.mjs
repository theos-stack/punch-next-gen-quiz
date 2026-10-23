import test from "node:test";
import assert from "node:assert/strict";
import { badgeIsEarned, badgesUnlockedByAttempt, projectLeaderboardEntries } from "../lib/student/presentation.mjs";
import { navigationProgressReducer } from "../lib/student/navigation-progress.mjs";

test("leaderboard labels only the authenticated ID-backed row as You and preserves rank", () => {
  const entries = [
    { rank: 1, display_name: "Amara", total_xp: 200, is_current_student: false },
    { rank: 8, display_name: "Samuel Ojo", total_xp: 30, is_current_student: true },
  ];
  const presented = projectLeaderboardEntries(entries);

  assert.deepEqual(presented.map(({ public_name, rank }) => ({ public_name, rank })), [
    { public_name: "Amara", rank: 1 },
    { public_name: "You", rank: 8 },
  ]);
  assert.equal(entries[1].display_name, "Samuel Ojo", "the stored/public name input is not mutated");
});

test("badge state distinguishes earned from locked without changing eligibility", () => {
  assert.equal(badgeIsEarned("2026-10-23T10:00:00Z"), true);
  assert.equal(badgeIsEarned(null), false);
  assert.equal(badgeIsEarned(undefined), false);
});

test("result badges include only awards created by this attempt", () => {
  const badges = [
    { badge_key: "quiz_starter", attempt_id: "first-attempt" },
    { badge_key: "high_scorer", attempt_id: "current-attempt" },
  ];

  assert.deepEqual(badgesUnlockedByAttempt(badges, "current-attempt"), [badges[1]]);
  assert.deepEqual(badgesUnlockedByAttempt(badges, "other-attempt"), []);
});

test("navigation feedback stays visible while a route is pending and clears on completion or failure", () => {
  const pending = navigationProgressReducer(false, "start");
  assert.equal(pending, true, "a delayed route has immediate pending feedback");
  assert.equal(navigationProgressReducer(pending, "complete"), false);
  assert.equal(navigationProgressReducer(pending, "failed"), false, "the fallback timeout clears failed navigation");
});
