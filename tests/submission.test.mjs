import test from "node:test";
import assert from "node:assert/strict";
import { validateSubmissionAnswers } from "../lib/quiz/submission.mjs";

const first = "20000000-0000-4000-8000-000000000001";
const second = "20000000-0000-4000-8000-000000000002";

test("accepts a complete-shaped answer list", () => {
  const answers = [
    { question_id: first, selected_option: "A" },
    { question_id: second, selected_option: "C" },
  ];
  assert.deepEqual(validateSubmissionAnswers(answers), { ok: true, answers });
});

test("rejects empty or non-array submissions", () => {
  assert.equal(validateSubmissionAnswers([]).ok, false);
  assert.equal(validateSubmissionAnswers(null).ok, false);
});

test("rejects malformed records, extra fields, and duplicate questions", () => {
  assert.equal(validateSubmissionAnswers([{ question_id: "bad", selected_option: "A" }]).ok, false);
  assert.equal(validateSubmissionAnswers([{ question_id: first, selected_option: "A", score: 1 }]).ok, false);
  assert.equal(validateSubmissionAnswers([
    { question_id: first, selected_option: "A" },
    { question_id: first.toUpperCase(), selected_option: "B" },
  ]).ok, false);
});
