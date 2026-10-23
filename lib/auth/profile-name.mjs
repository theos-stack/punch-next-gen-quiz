export function normalizeDisplayName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (name.length < 2 || name.length > 60) return null;
  for (const character of name) {
    const code = character.charCodeAt(0);
    if (code <= 31 || code === 127) return null;
  }
  return name;
}
