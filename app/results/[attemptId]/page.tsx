import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import { requireStudent } from "@/lib/student/require-student";
import { badgesUnlockedByAttempt } from "@/lib/student/presentation.mjs";
import { BadgeMedal } from "@/components/badge-medal";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const { supabase, displayName } = await requireStudent(`/results/${attemptId}`);
  const { data: attempt, error } = await supabase.from("quiz_attempts").select("id, quiz_id, status, score, total_questions, percentage, completed_at").eq("id", attemptId).maybeSingle();
  if (error) throw new Error("Unable to load result.");
  if (!attempt) notFound();
  if (attempt.status !== "completed") redirect("/history");
  const [{ data: quiz }, { data: answers }, { data: awardedBadges }] = await Promise.all([
    supabase.from("quizzes").select("title, slug").eq("id", attempt.quiz_id).maybeSingle(),
    supabase.from("submitted_answers").select("question_id, selected_option, is_correct").eq("attempt_id", attempt.id),
    supabase.from("student_badges").select("badge_key, awarded_at, attempt_id").eq("attempt_id", attempt.id),
  ]);
  const newlyUnlocked = badgesUnlockedByAttempt(awardedBadges ?? [], attempt.id);
  const badgeNames: Record<string, { name: string; description: string }> = {
    quiz_starter: { name: "Quiz Starter", description: "Complete your first quiz." },
    high_scorer: { name: "High Scorer", description: "Score at least 80% on a quiz." },
  };
  const questionIds = (answers ?? []).map((answer) => answer.question_id);
  const { data: questions } = questionIds.length ? await supabase.from("questions").select("id, prompt, options").in("id", questionIds) : { data: [] };
  const questionById = new Map((questions ?? []).map((question) => [question.id, question]));

  return <main className="dashboard-wrap"><StudentAppChrome displayName={displayName} currentPath={`/results/${attemptId}`} /><section className="dashboard-main result-page">
    <span className="eyebrow"><span className="eyebrow-dot" />Quiz complete</span><div className="result-score"><strong>{attempt.score}<span>/{attempt.total_questions}</span></strong><span>{attempt.percentage}%</span></div><h1 className="page-title">{quiz?.title ?? "Your result"}</h1><p className="page-lede">Your score has been saved to your account.</p>
    {newlyUnlocked.length > 0 && <section className="result-badge-unlocks" aria-labelledby="result-badge-title"><span className="section-kicker">NEW MILESTONE</span><h2 id="result-badge-title">Badge unlocked</h2><div className="badge-list">{newlyUnlocked.map((badge) => { const definition = badgeNames[badge.badge_key] ?? { name: "Achievement", description: "Awarded for your learning." }; return <div className="badge-item is-earned" key={badge.badge_key}><BadgeMedal badgeKey={badge.badge_key} earned /><span><strong>{definition.name}</strong><small>{definition.description}</small></span></div>; })}</div></section>}
    <div className="answer-review">{(answers ?? []).map((answer, index) => { const question = questionById.get(answer.question_id); const options = Array.isArray(question?.options) ? question.options as { id: string; text: string }[] : []; const selected = options.find((option) => option.id === answer.selected_option); return <article className="review-card" key={answer.question_id}><span className={`review-status ${answer.is_correct ? "correct" : "incorrect"}`}>{answer.is_correct ? "Correct" : "Review"} · {index + 1}</span><h2>{question?.prompt ?? "Question"}</h2><p>Your answer: <strong>{selected?.text ?? answer.selected_option}</strong></p></article>; })}</div>
    <div className="result-actions"><Link className="button-primary" href="/quizzes">Try another quiz</Link><Link className="button-secondary" href="/history">View all attempts</Link></div>
  </section><StudentMobileNav /></main>;
}
