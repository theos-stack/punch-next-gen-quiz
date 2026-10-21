import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  if (!hasSupabaseEnvironment()) redirect("/login?setup=missing");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/login?next=/leaderboard");
  const { data: entries, error } = await supabase.rpc("get_leaderboard", { p_limit: 100 });
  const leaderboardRows = (entries ?? []) as { rank: number; display_name: string; total_xp: number; completed_quizzes: number }[];

  return <main className="dashboard-wrap"><header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark">P</span><span>PUNCH NEXTGEN</span></Link><nav className="nav-links"><Link href="/quizzes">Quizzes</Link><form action="/api/auth/logout" method="post"><button className="button-primary">Log out</button></form></nav></header>
    <section className="dashboard-main"><Link className="back-link" href="/dashboard">← Dashboard</Link><span className="eyebrow"><span className="eyebrow-dot" />Learn, practice, grow</span><h1 className="page-title">Leaderboard</h1><p className="page-lede">Students ranked by quiz XP. Only display names and learning totals appear here.</p>
      {error ? <div className="form-error">Leaderboard could not be loaded. Check that the rewards migration has been applied.</div> : leaderboardRows.length ? <div className="leaderboard-table-wrap"><table className="leaderboard-table"><thead><tr><th scope="col">Rank</th><th scope="col">Student</th><th scope="col">XP</th><th scope="col">Completed quizzes</th></tr></thead><tbody>{leaderboardRows.map((entry) => <tr key={entry.rank}><td><span className={`rank-mark ${entry.rank <= 3 ? "top-rank" : ""}`}>{entry.rank}</span></td><th scope="row">{entry.display_name}</th><td>{entry.total_xp.toLocaleString()}</td><td>{entry.completed_quizzes}</td></tr>)}</tbody></table></div> : <div className="setup-note">There are no quiz results to rank yet. <Link className="inline-link" href="/quizzes">Take the first quiz.</Link></div>}
    </section></main>;
}
