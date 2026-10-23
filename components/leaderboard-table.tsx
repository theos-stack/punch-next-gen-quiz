"use client";

import { Fragment, useState } from "react";

export type LeaderboardEntry = {
  rank: number;
  display_name: string;
  total_xp: number;
  completed_quizzes: number;
  badge_keys: string[];
  is_current_student: boolean;
};

const badgeNames: Record<string, string> = {
  quiz_starter: "Quiz Starter",
  high_scorer: "High Scorer",
};

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  const [expandedRank, setExpandedRank] = useState<number | null>(null);
  return <div className="leaderboard-table-wrap">
    <table className="leaderboard-table">
      <thead><tr><th scope="col">Rank</th><th scope="col">Student</th><th scope="col">XP</th><th scope="col">Quizzes</th><th scope="col">Badges</th></tr></thead>
      <tbody>{entries.map((entry) => {
        const expanded = expandedRank === entry.rank;
        return <Fragment key={entry.rank}>
          <tr key={`entry-${entry.rank}`} className={`${entry.is_current_student ? "is-current-student" : ""}`}>
            <td><span className={`rank-mark ${entry.rank <= 3 ? "top-rank" : ""}`}>{entry.rank}</span></td>
            <th scope="row">
              <button className="leaderboard-name-button" type="button" aria-expanded={expanded} onClick={() => setExpandedRank(expanded ? null : entry.rank)}>
                {entry.display_name}<span aria-hidden="true">{expanded ? "⌃" : "⌄"}</span>
              </button>
              {entry.is_current_student && <small className="current-student-label">You</small>}
            </th>
            <td>{entry.total_xp.toLocaleString()}</td>
            <td>{entry.completed_quizzes.toLocaleString()}</td>
            <td>{entry.badge_keys.length ? entry.badge_keys.map((key) => badgeNames[key] ?? "Achievement").join(", ") : "—"}</td>
          </tr>
          {expanded && <tr key={`detail-${entry.rank}`} className="leaderboard-detail-row"><td colSpan={5}>
            <div><strong>{entry.display_name}&apos;s public learning profile</strong><span>{entry.completed_quizzes} completed {entry.completed_quizzes === 1 ? "quiz" : "quizzes"} · {entry.total_xp.toLocaleString()} XP</span>
              <span>Public badges: {entry.badge_keys.length ? entry.badge_keys.map((key) => badgeNames[key] ?? "Achievement").join(", ") : "No badges earned yet"}</span></div>
          </td></tr>}
        </Fragment>;
      })}</tbody>
    </table>
  </div>;
}
