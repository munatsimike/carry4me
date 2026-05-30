export function formatPersonDisplayName(
  fullName: string | null | undefined,
  fallback = "—",
): string {
  if (!fullName?.trim()) return fallback;

  return fullName.trim();
}
