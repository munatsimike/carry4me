import { useEffect, useState } from "react";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";

type Tag = "Traveler" | "Sender";

type UserProps = {
  tag: Tag;
  userName: string;
  avatar: string | null;
};

const INITIAL_AVATAR_COLORS = [
  "bg-sky-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
] as const;

function getPersonInitials(name: string): string {
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

function avatarColorClass(name: string): string {
  const seed = name.trim().toLowerCase();
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return INITIAL_AVATAR_COLORS[hash % INITIAL_AVATAR_COLORS.length];
}

export default function User({ userName, tag, avatar }: UserProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(avatar) && !imageFailed;
  const initials = getPersonInitials(userName);

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  return (
    <div className="flex min-w-0 items-center gap-3 sm:pl-8 md:pl-14">
      {showPhoto ? (
        <img
          src={avatar ?? ""}
          className="h-10 w-10 shrink-0 rounded-full border border-neutral-300 object-cover sm:h-12 sm:w-12"
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold tracking-wide text-white sm:h-12 sm:w-12 sm:text-base",
            avatarColorClass(userName),
          )}
        >
          {initials}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
        <CustomText
          textVariant="primary"
          textSize="md"
          className="truncate leading-none font-semimedium"
        >
          {userName}
        </CustomText>

        <CustomText
          textVariant="secondary"
          textSize="xs"
          className="leading-none"
        >
          {tag}
        </CustomText>
      </div>
    </div>
  );
}
