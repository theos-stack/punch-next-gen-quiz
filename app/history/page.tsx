import Link from "next/link";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import { requireStudent } from "@/lib/student/require-student";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { supabase, displayName } = await requireStudent("/history");
  const { data: attempts, error } = await supabase.from("quiz_attempts")
    .select("id, quiz_id, status, score, total_questions, percentage, started_at, completed_at")
    .order("started_at", { ascending: false });
  const quizIds = [...new Set((attempts ?? []).map((attempt) => attempt.quiz_id))];
  const { data: quizzes } = quizIds.length ? await supabase.from("quizzes").select("id, title, slug").in("id", quizIds) : { data: [] };
  const quizById = new Map((quizzes ?? []).map((quiz) => [quiz.id, quiz]));

  return <main className="dashboard-wrap">
    <StudentAppChrome displayName={displayName} currentPath="/history" />
    <section className="dashboard-main">
      <span className="eyebrow"><span className="eyebrow-dot" />Your learning journey</span>
      <h1 className="page-title">Quiz history</h1>
      <p className="page-lede">Review saved results and return to any quiz still in progress.</p>
      {error ? <div className="form-error" role="alert">Your attempts could not be loaded. Please refresh the page.</div> : attempts?.length ? <div className="history-list">{attempts.map((attempt) => {
        const quiz = quizById.get(attempt.quiz_id);
        return <article className="history-card" key={attempt.id}>
          <div><span className="quiz-card-label">{new Date(attempt.started_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span><h2>{quiz?.title ?? "Quiz"}</h2><p>{attempt.status === "completed" ? `${attempt.score} of ${attempt.total_questions} correct · ${attempt.percentage}%` : "In progress"}</p></div>
          {attempt.status === "completed" ? <Link className="button-secondary history-action" href={`/results/${attempt.id}`}>View saved result <span aria-hidden="true">→</span></Link> : quiz ? <Link className="button-secondary history-action" href={`/quiz/${quiz.slug}`}>Continue quiz <span aria-hidden="true">→</span></Link> : <span className="status-pill">In progress</span>}
        </article>;
      })}</div> : <div className="dashboard-empty-state history-empty"><span className="empty-state-icon" aria-hidden="true">◷</span><div><strong>Your history starts with your first quiz</strong><p>Completed results are saved here automatically.</p></div><Link href="/quizzes">Explore quizzes <span aria-hidden="true">→</span></Link></div>}
    </section>
    <StudentMobileNav />
  </main>;
}
