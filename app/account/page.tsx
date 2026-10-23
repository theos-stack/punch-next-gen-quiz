import Link from "next/link";
import { AccountProfileForm } from "@/components/account-profile-form";
import { StudentAppChrome } from "@/components/student-app-chrome";
import { StudentMobileNav } from "@/components/student-mobile-nav";
import { requireStudent } from "@/lib/student/require-student";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const student = await requireStudent("/account");
  const initials = student.displayName.trim().split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase() ?? "").join("") || "S";

  return <main className="dashboard-wrap">
    <StudentAppChrome displayName={student.displayName} currentPath="/account" />
    <section className="dashboard-main account-page">
      <span className="eyebrow"><span className="eyebrow-dot" />Your settings</span>
      <h1 className="page-title">Account</h1>
      <p className="page-lede">Manage the name students see in your learning space.</p>
      <section className="account-card" aria-labelledby="account-profile-title">
        <div className="account-card-heading"><span className="account-avatar" aria-hidden="true">{initials}</span><div><h2 id="account-profile-title">Profile details</h2><p>Your email stays private. Your display name appears on the leaderboard.</p></div></div>
        <AccountProfileForm displayName={student.displayName} email={student.email} />
      </section>
      <section className="account-security-note"><div><strong>Account access</strong><p>Your sign-in email is managed by Supabase Auth. To sign out of this device, use the button below.</p></div><form action="/api/auth/logout" method="post"><button className="button-quiet" type="submit">Log out</button></form></section>
      <p className="account-related-link">Review your progress in <Link href="/achievements">Achievements</Link>.</p>
    </section>
    <StudentMobileNav />
  </main>;
}
