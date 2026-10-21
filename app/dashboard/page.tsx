import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseEnvironment()) redirect("/login?setup=missing");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", claims.sub)
    .maybeSingle();

  const [xpResult, attemptsResult, completedCountResult, badgesResult] = await Promise.all([
    supabase.from("xp_awards").select("xp_amount").eq("user_id", claims.sub),
    supabase.from("quiz_attempts")
      .select("id, quiz_id, score, total_questions, percentage, completed_at")
      .eq("status", "completed").order("completed_at", { ascending: false }).limit(5),
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("student_badges").select("badge_key, awarded_at").order("awarded_at", { ascending: false }),
  ]);
  const recentAttempts = attemptsResult.data ?? [];
  const badgeRows = badgesResult.data ?? [];
  const [quizResult, badgeDefinitionsResult] = await Promise.all([
    recentAttempts.length
      ? supabase.from("quizzes").select("id, title").in("id", [...new Set(recentAttempts.map((attempt) => attempt.quiz_id))])
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    badgeRows.length
      ? supabase.from("badge_definitions").select("badge_key, name, description").in("badge_key", badgeRows.map((badge) => badge.badge_key))
      : Promise.resolve({ data: [] as { badge_key: string; name: string; description: string }[] }),
  ]);
  const xpTotal = (xpResult.data ?? []).reduce((sum, award) => sum + award.xp_amount, 0);
  const quizById = new Map((quizResult.data ?? []).map((quiz) => [quiz.id, quiz]));
  const badgeByKey = new Map((badgeDefinitionsResult.data ?? []).map((badge) => [badge.badge_key, badge]));

  const metadataName = typeof claims.user_metadata?.full_name === "string" ? claims.user_metadata.full_name : "Student";
  const displayName = profile?.full_name || metadataName;
  const email = typeof claims.email === "string" ? claims.email : "Your student account";

  return (
    <main className="dashboard-wrap">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="PUNCH NextGen home"><span className="brand-mark" aria-hidden="true">P</span><span>PUNCH NEXTGEN</span></Link>
        <form action="/api/auth/logout" method="post"><button className="button-primary" type="submit">Log out</button></form>
      </header>
      <section className="dashboard-main">
        <span className="eyebrow"><span className="eyebrow-dot" />Your student space</span>
        <div className="dashboard-heading"><div><h1>Welcome, {displayName.split(" ")[0]}.</h1><p>Your learning journey starts with one good question.</p></div></div>
        <div className="profile-card">
          <div className="avatar" aria-hidden="true">{displayName.trim().charAt(0).toUpperCase()}</div>
          <div><strong>{displayName}</strong><span>{email}</span></div>
        </div>
        <div className="dashboard-actions"><Link className="button-primary" href="/quizzes">Browse quizzes</Link><Link className="button-secondary" href="/history">All quiz attempts</Link><Link className="button-secondary" href="/leaderboard">Leaderboard →</Link></div>
        <div className="empty-tiles" aria-label="Your learning overview">
          <div className="empty-tile"><span>TOTAL XP</span><strong>{xpTotal.toLocaleString()}</strong></div>
          <div className="empty-tile"><span>COMPLETED QUIZZES</span><strong>{completedCountResult.count ?? 0}</strong></div>
          <div className="empty-tile"><span>BADGES</span><strong>{badgeRows.length}</strong></div>
        </div>
        <div className="dashboard-columns">
          <section className="dashboard-section" aria-labelledby="recent-title"><div className="section-heading"><h2 id="recent-title">Recent attempts</h2><Link href="/history">See all</Link></div>
            {recentAttempts.length ? <div className="dashboard-list">{recentAttempts.map((attempt) => <Link className="dashboard-list-row" key={attempt.id} href={`/results/${attempt.id}`}><span><strong>{quizById.get(attempt.quiz_id)?.title ?? "Quiz"}</strong><small>{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : "Completed"}</small></span><b>{attempt.score}/{attempt.total_questions}</b></Link>)}</div> : <p className="muted-copy">Complete a quiz to see your results here.</p>}
          </section>
          <section className="dashboard-section" aria-labelledby="badges-title"><div className="section-heading"><h2 id="badges-title">Your badges</h2></div>
            {badgeRows.length ? <div className="badge-list">{badgeRows.map((badge) => { const definition = badgeByKey.get(badge.badge_key); return <div className="badge-item" key={badge.badge_key}><span className="badge-medal" aria-hidden="true">★</span><span><strong>{definition?.name ?? "Badge"}</strong><small>{definition?.description ?? "Awarded for your learning."}</small></span></div>; })}</div> : <p className="muted-copy">Your first badge is waiting after your first quiz.</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
