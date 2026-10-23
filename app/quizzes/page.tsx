import Link from "next/link";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import { requireStudent } from "@/lib/student/require-student";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const { supabase, displayName } = await requireStudent("/quizzes");
  const { data: quizzes, error } = await supabase.from("quizzes")
    .select("id, slug, title, summary, duration_minutes").eq("is_published", true).order("created_at");

  return <main className="dashboard-wrap">
    <StudentAppChrome displayName={displayName} currentPath="/quizzes" />
    <section className="dashboard-main">
      <span className="eyebrow"><span className="eyebrow-dot" />Practice and grow</span>
      <h1 className="page-title">Available quizzes</h1>
      <p className="page-lede">Choose a topic, take your time, and see how much you know.</p>
      {error ? <div className="form-error" role="alert">Quizzes could not be loaded. Please refresh the page.</div> : quizzes?.length ? <div className="quiz-grid">{quizzes.map((quiz) => <article className="quiz-list-card" key={quiz.id}><span className="quiz-card-label">{quiz.duration_minutes} min · Quiz</span><h2>{quiz.title}</h2><p>{quiz.summary}</p><Link className="button-primary" href={`/quiz/${quiz.slug}`}>View quiz <span aria-hidden="true">→</span></Link></article>)}</div> : <div className="setup-note">No published quizzes are available yet.</div>}
    </section>
    <StudentMobileNav />
  </main>;
}
