import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-wrap">
      <aside className="auth-aside">
        <Link className="brand" href="/" aria-label="PUNCH NextGen home">
          <BrandMark />
          <span>PUNCH NEXTGEN</span>
        </Link>
        <div className="aside-content">
          <span className="eyebrow"><span className="eyebrow-dot" />Learn. Play. Earn.</span>
          <h1>Curiosity looks good on you.</h1>
          <p>Small moments of learning can lead to big things. Take a quiz, track your progress, and keep moving forward.</p>
        </div>
        <div className="aside-foot">A learning community built for your next big idea.</div>
      </aside>
      <section className="auth-main">{children}</section>
    </main>
  );
}
