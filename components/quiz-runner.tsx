"use client";

import { useState } from "react";

type QuizQuestion = { id: string; position: number; prompt: string; options: { id: string; text: string }[] };

export function QuizRunner({ slug, questions, durationMinutes }: { slug: string; questions: QuizQuestion[]; durationMinutes: number }) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/quizzes/${encodeURIComponent(slug)}/attempts`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not start the quiz.");
      setAttemptId(body.attemptId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start the quiz."); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!attemptId || Object.keys(answers).length !== questions.length) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: questions.map((question) => ({ question_id: question.id, selected_option: answers[question.id] })) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not submit your answers.");
      window.location.assign(`/results/${attemptId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit your answers."); }
    finally { setBusy(false); }
  }

  if (questions.length === 0) return <div className="setup-note">This quiz has no questions yet.</div>;
  if (!attemptId) return <section className="quiz-start-card">
    <div className="quiz-meta"><span>{questions.length} questions</span><span>{durationMinutes} minutes suggested</span></div>
    <p>{questions.length} multiple-choice questions. Your progress is saved when you submit your answers.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button-primary" onClick={start} disabled={busy}>{busy ? "Starting…" : "Start quiz"}</button>
  </section>;

  const question = questions[current];
  const answered = Object.keys(answers).length;
  return <section className="quiz-runner" aria-labelledby="question-title">
    <div className="quiz-runner-top"><span>Question {current + 1} of {questions.length}</span><span>{answered} answered · {durationMinutes} min suggested</span></div>
    <div className="progress-track" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={questions.length}><div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
    <h2 id="question-title">{question.prompt}</h2>
    <div className="quiz-options" role="group" aria-label="Answer options">
      {question.options.map((option) => <button key={option.id} className={`quiz-choice ${answers[question.id] === option.id ? "is-selected" : ""}`} aria-pressed={answers[question.id] === option.id} onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: option.id }))}>
        <span className="answer-key">{option.id}</span><span>{option.text}</span>
      </button>)}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="quiz-controls">
      <button className="button-quiet" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0 || busy}>Previous</button>
      {current < questions.length - 1
        ? <button className="button-primary" onClick={() => setCurrent((value) => Math.min(questions.length - 1, value + 1))}>Next question</button>
        : <button className="button-primary" onClick={submit} disabled={busy || answered !== questions.length}>{busy ? "Submitting…" : "Submit answers"}</button>}
    </div>
    {answered !== questions.length && <p className="form-hint">Answer every question to submit ({questions.length - answered} remaining).</p>}
  </section>;
}
