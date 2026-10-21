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
        <div className="setup-note"><strong>You&apos;re signed in.</strong> Your dashboard is ready. Quizzes, XP, badges, and leaderboard features will arrive in the next implementation phases.</div>
        <div className="empty-tiles" aria-label="Your learning overview">
          <div className="empty-tile"><span>QUIZ ATTEMPTS</span><strong>Coming soon</strong></div>
          <div className="empty-tile"><span>TOTAL XP</span><strong>Coming soon</strong></div>
          <div className="empty-tile"><span>ACHIEVEMENTS</span><strong>Coming soon</strong></div>
        </div>
      </section>
    </main>
  );
}
