export function StudentRouteLoading() {
  return <main className="student-loading-shell" aria-busy="true" aria-label="Loading student page">
    <aside className="student-loading-sidebar" aria-hidden="true"><span className="loading-skeleton loading-brand" /><span className="loading-skeleton loading-nav" /><span className="loading-skeleton loading-nav" /><span className="loading-skeleton loading-nav" /><span className="loading-skeleton loading-nav" /></aside>
    <header className="student-loading-topbar" aria-hidden="true"><span className="loading-skeleton loading-title" /><span className="loading-skeleton loading-avatar" /></header>
    <section className="student-loading-content" aria-hidden="true">
      <span className="loading-skeleton loading-eyebrow" /><span className="loading-skeleton loading-heading" /><span className="loading-skeleton loading-copy" />
      <div className="loading-stat-grid"><span className="loading-skeleton" /><span className="loading-skeleton" /><span className="loading-skeleton" /><span className="loading-skeleton" /></div>
      <span className="loading-skeleton loading-panel" /><span className="loading-skeleton loading-panel loading-panel-short" />
    </section>
    <nav className="student-loading-mobile-nav" aria-hidden="true"><span /><span /><span /><span /></nav>
    <span className="visually-hidden" role="status" aria-live="polite">Loading page</span>
  </main>;
}
