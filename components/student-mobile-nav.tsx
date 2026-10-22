"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/quizzes", label: "Quizzes", icon: "grid" },
  { href: "/leaderboard", label: "Ranks", icon: "award" },
  { href: "/history", label: "History", icon: "clock" },
] as const;

function Icon({ name }: { name: (typeof destinations)[number]["icon"] }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" /><path d="m10 8 1.3 1.3L14 6.7" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="student-mobile-nav" aria-label="Student navigation">
      {destinations.map(({ href, label, icon }) => {
        const active = pathname === href
          || (href === "/quizzes" && pathname.startsWith("/quiz/"))
          || (href === "/history" && pathname.startsWith("/results/"));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}>
            <Icon name={icon} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
