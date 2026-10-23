import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaderboardEntry } from "@/components/leaderboard-table";

type LegacyLeaderboardRow = {
  rank: number;
  display_name: string;
  total_xp: number;
  completed_quizzes: number;
};

export async function getStudentLeaderboard(supabase: SupabaseClient, limit: number) {
  const current = await supabase.rpc("get_student_workspace_leaderboard", { p_limit: limit });
  if (!current.error) {
    return {
      data: (current.data ?? []) as LeaderboardEntry[],
      error: null,
      usedLegacyFallback: false,
    };
  }

  if (current.error.code !== "PGRST202") {
    return { data: null, error: current.error, usedLegacyFallback: false };
  }

  const legacy = await supabase.rpc("get_leaderboard", { p_limit: limit });
  if (legacy.error) {
    return { data: null, error: legacy.error, usedLegacyFallback: false };
  }

  const data = (legacy.data ?? []) as LegacyLeaderboardRow[];
  return {
    data: data.map((entry) => ({
      ...entry,
      badge_keys: [],
      is_current_student: false,
    })),
    error: null,
    usedLegacyFallback: true,
  };
}
