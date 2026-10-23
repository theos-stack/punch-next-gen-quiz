export type PresentedLeaderboardEntry<T extends { is_current_student: boolean; display_name: string }> = T & {
  public_name: string;
};

export function projectLeaderboardEntries<T extends { is_current_student: boolean; display_name: string }>(entries: T[]): PresentedLeaderboardEntry<T>[];
export function badgeIsEarned(awardedAt: string | null | undefined): boolean;
export function badgesUnlockedByAttempt<T extends { attempt_id: string }>(badges: T[], attemptId: string): T[];
