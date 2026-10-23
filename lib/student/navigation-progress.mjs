export function navigationProgressReducer(isPending, event) {
  if (event === "start") return true;
  if (event === "complete" || event === "failed") return false;
  return isPending;
}
