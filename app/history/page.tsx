import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { StudentMobileNav } from "@/components/student-mobile-nav";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  if (!hasSupabaseEnvironment()) redirect("/login?setup=missing");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/login?next=/history");
  const { data: attempts, error } = await supabase.from("quiz_attempts")
    .select("id, quiz_id, status, score, total_questions, percentage, started_at, completed_at")
    .order("started_at", { ascending: false });
  const quizIds = [...new Set((attempts ?? []).map((attempt) => attempt.quiz_id))];
  const { data: quizzes } = quizIds.length ? await supabase.from("quizzes").select("id, title, slug").in("id", quizIds) : { data: [] };
  const quizById = new Map((quizzes ?? []).map((quiz) => [quiz.id, quiz]));

  return <main className="dashboard-wrap"><header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark">P</span><span>PUNCH NEXTGEN</span></Link><nav className="nav-links"><Link href="/quizzes">Quizzes</Link><form action="/api/auth/logout" method="post"><button className="button-primary">Log out</button></form></nav></header>
    <section className="dashboard-main"><Link className="back-link" href="/dashboard">← Dashboard</Link><span className="eyebrow"><span className="eyebrow-dot" />Your learning journey</span><h1 className="page-title">Quiz history</h1><p className="page-lede">Your attempts and completed results.</p>
      {error ? <div className="form-error">Your attempts could not be loaded. Check that the database migration has been applied.</div> : attempts?.length ? <div className="history-list">{attempts.map((attempt) => { const quiz = quizById.get(attempt.quiz_id); return <article className="history-card" key={attempt.id}><div><span className="quiz-card-label">{new Date(attempt.started_at).toLocaleDateString()}</span><h2>{quiz?.title ?? "Quiz"}</h2><p>{attempt.status === "completed" ? `${attempt.score} of ${attempt.total_questions} correct · ${attempt.percentage}%` : "In progress"}</p></div>{attempt.status === "completed" ? <Link className="button-secondary" href={`/results/${attempt.id}`}>View result</Link> : <span className="status-pill">In progress</span>}</article>; })}</div> : <div className="setup-note">You have not started a quiz yet. <Link className="inline-link" href="/quizzes">Explore quizzes</Link>.</div>}
    </section><StudentMobileNav /></main>;
}
