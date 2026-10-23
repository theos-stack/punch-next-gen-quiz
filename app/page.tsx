import Link from "next/link";

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="PUNCH NextGen home">
      <span className="brand-mark" aria-hidden="true">P</span>
      <span>PUNCH <span style={{ color: "var(--green)" }}>NEXTGEN</span></span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="#how-it-works">How it works</Link>
          <Link href="/login">Log in</Link>
          <Link className="nav-button" href="/register">Get Started</Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" />A smarter way to learn</span>
          <h1>Big ideas.<br />Quick quizzes.<br /><span>Real rewards.</span></h1>
          <p className="hero-copy">Put what you know to the test, build a learning streak, and earn recognition as you grow. Your next great result starts with one question.</p>
          <div className="hero-actions">
            <Link className="button-primary" href="/register">Create your account <span aria-hidden="true">&nbsp;→</span></Link>
            <Link className="button-secondary" href="/login">I already have an account</Link>
          </div>
          <p className="trust-note"><span className="trust-check" aria-hidden="true">✓</span>Made for curious students, one quiz at a time.</p>
        </div>

        <div className="hero-visual" aria-label="Preview of a quiz question and score" role="img">
          <div className="visual-backdrop" />
          <div className="quiz-card">
            <div className="quiz-card-top"><span>GENERAL KNOWLEDGE</span><span>06 / 10</span></div>
            <div className="progress-track"><div className="progress-fill" /></div>
            <h2>Which planet is known as the Red Planet?</h2>
            <div className="answer-option"><span className="answer-key">A</span>Venus</div>
            <div className="answer-option selected"><span className="answer-key">B</span>Mars <span aria-hidden="true" style={{ marginLeft: "auto", color: "var(--green)" }}>✓</span></div>
            <div className="answer-option"><span className="answer-key">C</span>Jupiter</div>
          </div>
          <div className="score-float"><strong>+10 XP</strong><span>Every correct answer counts</span></div>
        </div>
      </section>

      <section className="feature-strip" id="how-it-works" aria-label="Platform highlights">
        <div className="feature-inner">
          <div className="feature-item"><span className="feature-icon" aria-hidden="true">01</span><div><strong>Learn at your pace</strong><span>Short quizzes that fit your day.</span></div></div>
          <div className="feature-item"><span className="feature-icon" aria-hidden="true">✦</span><div><strong>Celebrate progress</strong><span>Build a record of what you know.</span></div></div>
          <div className="feature-item"><span className="feature-icon" aria-hidden="true">↗</span><div><strong>Earn as you grow</strong><span>Points and milestones are ahead.</span></div></div>
        </div>
      </section>
      <footer className="footer">© {new Date().getFullYear()} PUNCH NextGen Quiz &amp; Rewards</footer>
    </main>
  );
}
