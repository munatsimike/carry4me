const INITIAL_AVATAR_COLORS = [
  "bg-sky-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
] as const;

export function formatListingCardUserName(
  fullName: string | null | undefined,
): string {
  if (!fullName?.trim()) return "";

  const parts = fullName.trim().split(/\s+/);
  const firstInitial = parts[0].charAt(0).toUpperCase();

  if (parts.length === 1) {
    return `${firstInitial}.`;
  }

  const surname = parts.slice(1).join(" ");
  return `${firstInitial}. ${surname}`;
}

export function getPersonInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/^[.\-']+|[.\-']+$/g, ""))
    .filter(Boolean);

  const letters = parts
    .map((part) => {
      const letter = [...part].find((character) => /\p{L}/u.test(character));
      return letter?.toUpperCase() ?? "";
    })
    .filter(Boolean);

  if (letters.length === 0) return "?";
  if (letters.length === 1) return letters[0];
  return `${letters[0]}${letters[letters.length - 1]}`;
}

export function avatarColorClass(name: string): string {
  const seed = name.trim().toLowerCase();
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return INITIAL_AVATAR_COLORS[hash % INITIAL_AVATAR_COLORS.length];
}
