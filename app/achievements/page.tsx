import Link from "next/link";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import { requireStudent } from "@/lib/student/require-student";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const { supabase, displayName } = await requireStudent("/achievements");
  const [definitionsResult, earnedResult] = await Promise.all([
    supabase.from("badge_definitions").select("badge_key, name, description").order("badge_key"),
    supabase.from("student_badges").select("badge_key, awarded_at").order("awarded_at", { ascending: false }),
  ]);
  const earned = new Map((earnedResult.data ?? []).map((badge) => [badge.badge_key, badge.awarded_at]));
  const definitions = definitionsResult.data ?? [];

  return <main className="dashboard-wrap">
    <StudentAppChrome displayName={displayName} currentPath="/achievements" />
    <section className="dashboard-main achievements-page">
      <span className="eyebrow"><span className="eyebrow-dot" />Progress you earned</span>
      <h1 className="page-title">Achievements</h1>
      <p className="page-lede">Every badge is tied to a real quiz result and awarded once by the database.</p>
      {definitionsResult.error || earnedResult.error ? <div className="form-error" role="alert">Achievements could not be loaded. Refresh the page to try again.</div> : definitions.length ? <div className="achievement-grid">
        {definitions.map((badge) => {
          const awardedAt = earned.get(badge.badge_key);
          return <article className={`achievement-card ${awardedAt ? "is-earned" : "is-locked"}`} key={badge.badge_key}>
            <span className="badge-medal" aria-hidden="true">{awardedAt ? "★" : "◇"}</span>
            <div><span className="achievement-state">{awardedAt ? "Earned" : "Not yet earned"}</span><h2>{badge.name}</h2><p>{badge.description}</p>
              {badge.badge_key === "quiz_starter" && <small>Unlock: complete your first quiz.</small>}
              {badge.badge_key === "high_scorer" && <small>Unlock: score 80% or higher on a quiz.</small>}
              {awardedAt && <time dateTime={awardedAt}>Awarded {new Date(awardedAt).toLocaleDateString()}</time>}
            </div>
          </article>;
        })}
      </div> : <div className="setup-note">No achievement definitions are available yet.</div>}
      <div className="achievement-footer"><p>Want to earn a badge? Complete a quiz and your rewards will appear here.</p><Link className="button-primary" href="/quizzes">Explore quizzes</Link></div>
    </section>
    <StudentMobileNav />
  </main>;
}
