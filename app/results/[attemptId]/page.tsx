import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  if (!hasSupabaseEnvironment()) redirect("/login?setup=missing");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect(`/login?next=${encodeURIComponent(`/results/${attemptId}`)}`);
  const { data: attempt, error } = await supabase.from("quiz_attempts").select("id, quiz_id, status, score, total_questions, percentage, completed_at").eq("id", attemptId).maybeSingle();
  if (error) throw new Error("Unable to load result.");
  if (!attempt) notFound();
  if (attempt.status !== "completed") redirect("/history");
  const [{ data: quiz }, { data: answers }] = await Promise.all([
    supabase.from("quizzes").select("title, slug").eq("id", attempt.quiz_id).maybeSingle(),
    supabase.from("submitted_answers").select("question_id, selected_option, is_correct").eq("attempt_id", attempt.id),
  ]);
  const questionIds = (answers ?? []).map((answer) => answer.question_id);
  const { data: questions } = questionIds.length ? await supabase.from("questions").select("id, prompt, options").in("id", questionIds) : { data: [] };
  const questionById = new Map((questions ?? []).map((question) => [question.id, question]));

  return <main className="dashboard-wrap"><header className="topbar"><Link className="brand" href="/quizzes"><span className="brand-mark">P</span><span>PUNCH NEXTGEN</span></Link><Link className="button-secondary" href="/history">Quiz history</Link></header><section className="dashboard-main result-page">
    <span className="eyebrow"><span className="eyebrow-dot" />Quiz complete</span><div className="result-score"><strong>{attempt.score}<span>/{attempt.total_questions}</span></strong><span>{attempt.percentage}%</span></div><h1 className="page-title">{quiz?.title ?? "Your result"}</h1><p className="page-lede">Your score has been saved to your account.</p>
    <div className="answer-review">{(answers ?? []).map((answer, index) => { const question = questionById.get(answer.question_id); const options = Array.isArray(question?.options) ? question.options as { id: string; text: string }[] : []; const selected = options.find((option) => option.id === answer.selected_option); return <article className="review-card" key={answer.question_id}><span className={`review-status ${answer.is_correct ? "correct" : "incorrect"}`}>{answer.is_correct ? "Correct" : "Review"} · {index + 1}</span><h2>{question?.prompt ?? "Question"}</h2><p>Your answer: <strong>{selected?.text ?? answer.selected_option}</strong></p></article>; })}</div>
    <div className="result-actions"><Link className="button-primary" href="/quizzes">Try another quiz</Link><Link className="button-secondary" href="/history">View all attempts</Link></div>
  </section></main>;
}
