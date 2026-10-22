import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { StudentMobileNav } from "@/components/student-mobile-nav";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  if (!hasSupabaseEnvironment()) redirect("/login?setup=missing");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/login?next=/quizzes");
  const { data: quizzes, error } = await supabase.from("quizzes")
    .select("id, slug, title, summary, duration_minutes").eq("is_published", true).order("created_at");

  return <main className="dashboard-wrap"><header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark">P</span><span>PUNCH NEXTGEN</span></Link><nav className="nav-links"><Link href="/history">My attempts</Link><form action="/api/auth/logout" method="post"><button className="button-primary">Log out</button></form></nav></header>
    <section className="dashboard-main"><Link className="back-link" href="/dashboard">← Dashboard</Link><span className="eyebrow"><span className="eyebrow-dot" />Practice and grow</span><h1 className="page-title">Available quizzes</h1><p className="page-lede">Choose a topic and see what you know.</p>
      {error ? <div className="form-error">Quizzes could not be loaded. Check that the database migration has been applied.</div> : quizzes?.length ? <div className="quiz-grid">{quizzes.map((quiz) => <article className="quiz-list-card" key={quiz.id}><span className="quiz-card-label">{quiz.duration_minutes} min · Quiz</span><h2>{quiz.title}</h2><p>{quiz.summary}</p><Link className="button-primary" href={`/quiz/${quiz.slug}`}>View quiz</Link></article>)}</div> : <div className="setup-note">No published quizzes are available yet.</div>}
    </section><StudentMobileNav /></main>;
}
