export function logLeaderboardRpcFailure(errorCode, logger = globalThis.console) {
  const code = typeof errorCode === "string" && /^[A-Z0-9]+$/.test(errorCode)
    ? errorCode
    : "UNKNOWN";

  logger.error("Student workspace leaderboard RPC failed.", { code });
}
