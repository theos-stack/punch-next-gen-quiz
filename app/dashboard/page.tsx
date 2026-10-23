import Link from "next/link";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import type { LeaderboardEntry } from "@/components/leaderboard-table";
import { getStudentLeaderboard } from "@/lib/student/leaderboard";
import { requireStudent } from "@/lib/student/require-student";

export const dynamic = "force-dynamic";

type PageResult<T> = { data: T[] | null; error: unknown };

async function readAllPages<T>(readPage: (start: number, end: number) => Promise<PageResult<T>>) {
  const rows: T[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await readPage(start, start + 499);
    if (error || !data) return null;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

export default async function DashboardPage() {
  const { supabase, displayName } = await requireStudent("/dashboard");
  const [xpRows, percentages, recentResult, completedCount, badgesResult, definitionsResult, quizResult, leaderboardResult] = await Promise.all([
    readAllPages<{ xp_amount: number }>(async (start, end) => await supabase.from("xp_awards").select("xp_amount").order("awarded_at").range(start, end)),
    readAllPages<{ percentage: number }>(async (start, end) => await supabase.from("quiz_attempts").select("percentage").eq("status", "completed").order("completed_at", { ascending: false }).range(start, end)),
    supabase.from("quiz_attempts").select("id, quiz_id, score, total_questions, percentage, completed_at").eq("status", "completed").order("completed_at", { ascending: false }).limit(5),
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("student_badges").select("badge_key, awarded_at").order("awarded_at", { ascending: false }),
    supabase.from("badge_definitions").select("badge_key, name, description").order("badge_key"),
    supabase.from("quizzes").select("id, slug, title, summary, duration_minutes").eq("is_published", true).order("created_at").limit(3),
    getStudentLeaderboard(supabase, 5),
  ]);

  const recentAttempts = recentResult.data ?? [];
  const badgeRows = badgesResult.data ?? [];
  const [recentQuizzesResult] = await Promise.all([
    recentAttempts.length
      ? supabase.from("quizzes").select("id, title").in("id", [...new Set(recentAttempts.map((attempt) => attempt.quiz_id))])
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const xpTotal = xpRows?.reduce((sum, award) => sum + award.xp_amount, 0) ?? null;
  const average = percentages?.length ? Math.round(percentages.reduce((sum, attempt) => sum + attempt.percentage, 0) / percentages.length) : null;
  const bestScore = percentages?.length ? Math.max(...percentages.map((attempt) => attempt.percentage)) : null;
  const latestScores = (percentages ?? []).slice(0, 2);
  const trend = latestScores.length > 1 ? latestScores[0].percentage - latestScores[1].percentage : null;
  const performance = percentages?.length
    ? trend === null ? `Your best score so far is ${bestScore}%.` : trend > 0 ? `Your latest score is up ${trend} points from your previous quiz.` : trend < 0 ? `Your latest score is down ${Math.abs(trend)} points. Another practice round can help.` : "You matched your previous score. Keep building on it."
    : "Your first completed quiz will give you a score to build on.";
  const quizById = new Map((recentQuizzesResult.data ?? []).map((quiz) => [quiz.id, quiz]));
  const badgeByKey = new Map((definitionsResult.data ?? []).map((badge) => [badge.badge_key, badge]));
  const leaderboardRows = (leaderboardResult.data ?? []) as LeaderboardEntry[];
  const topFive = leaderboardRows.filter((entry) => entry.rank <= 5);
  const currentStanding = leaderboardRows.find((entry) => entry.is_current_student);

  return <main className="dashboard-wrap">
    <StudentAppChrome displayName={displayName} currentPath="/dashboard" />
    <section className="dashboard-main dashboard-home">
      <div className="dashboard-heading">
        <div><span className="eyebrow"><span className="eyebrow-dot" />Your student space</span><h1>Welcome back, {displayName.split(" ")[0]}.</h1><p>Choose your next topic, keep learning and watch your progress grow.</p></div>
        <Link className="button-primary dashboard-heading-action" href="/quizzes">Start a quiz <span aria-hidden="true">→</span></Link>
      </div>

      <section className="dashboard-stat-grid" aria-label="Your learning statistics">
        <article className="dashboard-stat-card xp-stat-card"><span className="stat-icon" aria-hidden="true">✦</span><div><span>Total XP</span><strong>{xpTotal === null ? "—" : xpTotal.toLocaleString()}</strong></div></article>
        <article className="dashboard-stat-card"><span className="stat-icon" aria-hidden="true">✓</span><div><span>Completed quizzes</span><strong>{completedCount.count ?? 0}</strong></div></article>
        <article className="dashboard-stat-card"><span className="stat-icon" aria-hidden="true">↗</span><div><span>Leaderboard rank</span><strong>{currentStanding ? `#${currentStanding.rank}` : "—"}</strong></div></article>
        <article className="dashboard-stat-card"><span className="stat-icon" aria-hidden="true">％</span><div><span>Average score</span><strong>{average === null ? "—" : `${average}%`}</strong></div></article>
      </section>

      {(xpTotal === null || percentages === null || recentResult.error || completedCount.error || badgesResult.error || quizResult.error) && <p className="dashboard-data-note" role="status">Some learning statistics could not be refreshed. Try reloading the page.</p>}

      <section className="dashboard-block" aria-labelledby="available-quizzes-title">
        <div className="section-heading"><div><span className="section-kicker">PICK UP WHERE YOU LEFT OFF</span><h2 id="available-quizzes-title">Available quizzes</h2></div><Link href="/quizzes">Browse all <span aria-hidden="true">→</span></Link></div>
        {quizResult.error ? <p className="muted-copy">Quizzes could not be loaded. Please refresh the page.</p> : quizResult.data?.length ? <div className="dashboard-quiz-grid">
          {quizResult.data.map((quiz) => <article className="dashboard-quiz-card" key={quiz.id}><span className="quiz-card-label">{quiz.duration_minutes} min · Quiz</span><h3>{quiz.title}</h3><p>{quiz.summary}</p><Link href={`/quiz/${quiz.slug}`} aria-label={`Start ${quiz.title}`}>Start quiz <span aria-hidden="true">→</span></Link></article>)}
        </div> : <div className="setup-note">No published quizzes are available yet.</div>}
      </section>

      <div className="dashboard-hub-grid">
        <div className="dashboard-hub-main">
          <section className="dashboard-block recent-block" aria-labelledby="recent-title">
            <div className="section-heading"><div><span className="section-kicker">YOUR LAST FIVE COMPLETED</span><h2 id="recent-title">Recent activity</h2></div><Link href="/history">Full history <span aria-hidden="true">→</span></Link></div>
            {recentAttempts.length ? <div className="dashboard-list">{recentAttempts.map((attempt) => <Link className="dashboard-list-row" key={attempt.id} href={`/results/${attempt.id}`}>
              <span className="activity-icon" aria-hidden="true">✓</span><span className="activity-copy"><strong>{quizById.get(attempt.quiz_id)?.title ?? "Quiz"}</strong><small>{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Completed"}</small></span><span className="activity-score">{attempt.score}/{attempt.total_questions}<small>{attempt.percentage}%</small></span><span className="activity-arrow" aria-hidden="true">→</span>
            </Link>)}</div> : <div className="dashboard-empty-state"><span className="empty-state-icon" aria-hidden="true">◷</span><div><strong>Your recent activity will appear here</strong><p>Finish a quiz to see your score and saved result.</p></div><Link href="/quizzes">Choose a quiz <span aria-hidden="true">→</span></Link></div>}
          </section>
          <section className="dashboard-block leaderboard-preview" aria-labelledby="leaderboard-preview-title">
            <div className="section-heading"><div><span className="section-kicker">LEARN TOGETHER</span><h2 id="leaderboard-preview-title">Leaderboard</h2></div><Link href="/leaderboard">Full rankings <span aria-hidden="true">→</span></Link></div>
            {leaderboardResult.error ? <p className="muted-copy">Leaderboard could not be loaded. Please try again later.</p> : topFive.length ? <div className="leaderboard-preview-list">{topFive.map((entry) => <div className={`leaderboard-preview-row ${entry.is_current_student ? "is-current-student" : ""}`} key={entry.rank}><span className={`rank-mark ${entry.rank <= 3 ? "top-rank" : ""}`}>{entry.rank}</span><strong>{entry.display_name}{entry.is_current_student && <small>You</small>}</strong><span>{entry.total_xp.toLocaleString()} XP</span></div>)}</div> : <p className="muted-copy">Complete a quiz to join the rankings.</p>}
            {leaderboardResult.usedLegacyFallback && <p className="muted-copy" role="status">Top rankings are available. Your exact rank and public badges are temporarily unavailable.</p>}
            {currentStanding && currentStanding.rank > 5 && <div className="personal-rank-callout"><span>Your current position</span><strong>#{currentStanding.rank}</strong><small>{currentStanding.total_xp.toLocaleString()} XP · {currentStanding.completed_quizzes} completed quizzes</small></div>}
          </section>
        </div>
        <aside className="dashboard-hub-aside">
          <section className="dashboard-block insight-card" aria-labelledby="insight-title"><span className="insight-mark" aria-hidden="true">↗</span><span className="section-kicker">YOUR PERFORMANCE</span><h2 id="insight-title">A little progress adds up</h2><p>{performance}</p>{average !== null && <div className="insight-metric"><span>Average score</span><strong>{average}%</strong></div>}</section>
          <section className="dashboard-block achievement-preview" aria-labelledby="badges-title">
            <div className="section-heading"><div><span className="section-kicker">MILESTONES</span><h2 id="badges-title">Achievements</h2></div><Link href="/achievements" aria-label="View all achievements">All <span aria-hidden="true">→</span></Link></div>
            {badgeRows.length ? <div className="badge-list">{badgeRows.map((badge) => { const definition = badgeByKey.get(badge.badge_key); return <div className="badge-item" key={badge.badge_key}><span className="badge-medal" aria-hidden="true">★</span><span><strong>{definition?.name ?? "Achievement"}</strong><small>{definition?.description ?? "Awarded for your learning."}</small></span></div>; })}</div> : <div className="badge-empty"><span className="badge-medal" aria-hidden="true">◇</span><p>Complete your first quiz to earn Quiz Starter.</p></div>}
            <Link className="subtle-page-link" href="/achievements">See badge requirements <span aria-hidden="true">→</span></Link>
          </section>
        </aside>
      </div>
    </section>
    <StudentMobileNav />
  </main>;
}
