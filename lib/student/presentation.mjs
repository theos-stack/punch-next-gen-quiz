export function projectLeaderboardEntries(entries) {
  return entries.map((entry) => ({
    ...entry,
    public_name: entry.is_current_student ? "You" : entry.display_name,
  }));
}

export function badgeIsEarned(awardedAt) {
  return typeof awardedAt === "string" && awardedAt.length > 0;
}

export function badgesUnlockedByAttempt(badges, attemptId) {
  return badges.filter((badge) => badge.attempt_id === attemptId);
}
