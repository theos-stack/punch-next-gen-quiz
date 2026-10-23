export function BadgeMedal({ badgeKey, earned }: { badgeKey: string; earned: boolean }) {
  return <span className={`badge-medal badge-medal-${badgeKey} ${earned ? "is-earned" : "is-locked"}`} aria-hidden="true">
    <svg viewBox="0 0 40 40" fill="none">
      <path d="M12 4h16l-2.4 11.2H14.4L12 4Z" fill="currentColor" opacity=".34" />
      <path d="m12.8 13.5-2.5 22L20 30l9.7 5.5-2.5-22" fill="currentColor" opacity=".72" />
      {badgeKey === "high_scorer"
        ? <path d="m20 14.2 1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6 1.8-3.7Z" fill="currentColor" />
        : <path d="m20 14.6 1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5 1.6-3.2Z" fill="currentColor" />}
    </svg>
  </span>;
}
