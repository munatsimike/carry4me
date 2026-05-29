function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatPersonDisplayName(
  fullName: string | null | undefined,
  fallback = "—",
): string {
  if (!fullName?.trim()) return fallback;

  return fullName.trim().split(/\s+/).map(toTitleCase).join(" ");
}
