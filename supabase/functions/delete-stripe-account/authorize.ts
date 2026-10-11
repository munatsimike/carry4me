export function parseAdminUserIds(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[\s,]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isDesignatedStripeAdmin(input: {
  userId: string | null | undefined;
  profileType: string | null | undefined;
  allowlist: string[];
}): boolean {
  const userId = input.userId?.trim().toLowerCase();
  if (!userId) return false;
  if (input.allowlist.length === 0) return false;
  if (input.profileType !== "admin") return false;
  return input.allowlist.includes(userId);
}
