import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/quiz-runner";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import { requireStudent } from "@/lib/student/require-student";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, displayName } = await requireStudent(`/quiz/${slug}`);
  const { data: quiz, error } = await supabase.from("quizzes").select("id, slug, title, summary, instructions, duration_minutes").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error) throw new Error("Unable to load quiz.");
  if (!quiz) notFound();
  const { data: questions, error: questionError } = await supabase.from("questions").select("id, position, prompt, options").eq("quiz_id", quiz.id).order("position");
  if (questionError) throw new Error("Unable to load quiz questions.");
  const safeQuestions = (questions ?? []).map((question) => ({ ...question, options: Array.isArray(question.options) ? question.options as { id: string; text: string }[] : [] }));

  return <main className="dashboard-wrap"><StudentAppChrome displayName={displayName} currentPath={`/quiz/${slug}`} />
    <section className="dashboard-main quiz-page"><Link className="back-link" href="/quizzes">← All quizzes</Link><span className="eyebrow"><span className="eyebrow-dot" />{quiz.duration_minutes} minutes suggested</span><h1 className="page-title">{quiz.title}</h1><p className="page-lede">{quiz.summary}</p><div className="setup-note"><strong>Before you begin</strong><p>{quiz.instructions}</p></div>
      <QuizRunner slug={quiz.slug} questions={safeQuestions} durationMinutes={quiz.duration_minutes} />
    </section><StudentMobileNav /></main>;
}
