import Link from "next/link";
import { LeaderboardTable, type LeaderboardEntry } from "@/components/leaderboard-table";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import { getStudentLeaderboard } from "@/lib/student/leaderboard";
import { requireStudent } from "@/lib/student/require-student";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { supabase, displayName } = await requireStudent("/leaderboard");
  const { data, error, usedLegacyFallback } = await getStudentLeaderboard(supabase, 100);
  const entries = (data ?? []) as LeaderboardEntry[];
  const current = entries.find((entry) => entry.is_current_student);

  return <main className="dashboard-wrap">
    <StudentAppChrome displayName={displayName} currentPath="/leaderboard" />
    <section className="dashboard-main leaderboard-page">
      <span className="eyebrow"><span className="eyebrow-dot" />Learn, practice, grow</span>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-lede">See how students are progressing. Public names, XP, completed quizzes and earned badges are shown here.</p>
      {current && <div className="leaderboard-your-standing"><span><strong>Your current position</strong><small>{current.completed_quizzes} completed {current.completed_quizzes === 1 ? "quiz" : "quizzes"} · {current.total_xp.toLocaleString()} XP</small></span><strong>#{current.rank}</strong></div>}
      {error ? <div className="form-error" role="alert">Leaderboard could not be loaded. Please refresh the page.</div> : entries.length ? <LeaderboardTable entries={entries} badgesAvailable={!usedLegacyFallback} /> : <div className="setup-note">There are no quiz results to rank yet. <Link className="inline-link" href="/quizzes">Take the first quiz.</Link></div>}
      {usedLegacyFallback && <p className="leaderboard-privacy-note" role="status">Showing available rankings. Your exact position and badge details are temporarily unavailable.</p>}
      <p className="leaderboard-privacy-note">Email addresses, submitted answers and private account details are never shown.</p>
    </section>
    <StudentMobileNav />
  </main>;
}
