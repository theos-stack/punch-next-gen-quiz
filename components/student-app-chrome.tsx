import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const destinations = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/quizzes", label: "Quizzes", icon: "grid" },
  { href: "/leaderboard", label: "Leaderboard", icon: "award" },
  { href: "/history", label: "History", icon: "clock" },
  { href: "/achievements", label: "Achievements", icon: "medal" },
  { href: "/account", label: "Account", icon: "user" },
] as const;

type IconName = (typeof destinations)[number]["icon"];

function Icon({ name }: { name: IconName }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" /><path d="m10 8 1.3 1.3L14 6.7" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    medal: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "S";
}

function activeFor(href: string, currentPath: string) {
  if (href === "/quizzes") return currentPath === href || currentPath.startsWith("/quiz/");
  if (href === "/history") return currentPath === href || currentPath.startsWith("/results/");
  return currentPath === href;
}

export function StudentAppChrome({ displayName, currentPath }: { displayName: string; currentPath: string }) {
  const pageTitle = destinations.find(({ href }) => activeFor(href, currentPath))?.label ?? "Student hub";
  return <>
    <aside className="student-sidebar" aria-label="Student workspace">
      <Link className="student-sidebar-brand" href="/dashboard" aria-label="PUNCH NextGen overview">
        <BrandMark /><span><strong>PUNCH NEXTGEN</strong><small>STUDENT HUB</small></span>
      </Link>
      <span className="sidebar-section-label">LEARN</span>
      <nav className="student-sidebar-nav" aria-label="Main navigation">
        {destinations.map(({ href, label, icon }) => {
          const active = activeFor(href, currentPath);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined} title={label}>
            <Icon name={icon} /><span>{label}</span>
          </Link>;
        })}
      </nav>
      <div className="student-sidebar-bottom">
        <Link className="sidebar-profile" href="/account">
          <span className="initials-avatar" aria-hidden="true">{initials(displayName)}</span>
          <span><strong>{displayName}</strong><small>Student account</small></span>
        </Link>
        <form action="/api/auth/logout" method="post">
          <button className="sidebar-logout" type="submit"><span aria-hidden="true">↗</span> Log out</button>
        </form>
      </div>
    </aside>
    <header className="student-topbar">
      <div className="student-topbar-title"><span>STUDENT WORKSPACE</span><strong>{pageTitle}</strong></div>
      <Link className="student-topbar-account" href="/account" aria-label={`Account settings for ${displayName}`}>
        <span className="initials-avatar" aria-hidden="true">{initials(displayName)}</span><span>{displayName}</span><span className="topbar-chevron" aria-hidden="true">⌄</span>
      </Link>
    </header>
  </>;
}
