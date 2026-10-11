import { useEffect, useState } from "react";
import { cn } from "@/app/lib/cn";
import {
  avatarColorClass,
  formatListingCardUserName,
  getPersonInitials,
} from "./personInitials";

type PersonAvatarProps = {
  fullName: string | null | undefined;
  avatarUrl: string | null | undefined;
  className?: string;
  textClassName?: string;
  alt?: string;
};

export default function PersonAvatar({
  fullName,
  avatarUrl,
  className,
  textClassName,
  alt = "",
}: PersonAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(avatarUrl) && !imageFailed;
  const displayName = formatListingCardUserName(fullName);
  const initials = getPersonInitials(displayName || fullName || "");

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  if (showPhoto) {
    return (
      <img
        src={avatarUrl ?? ""}
        alt={alt}
        className={cn(
          "shrink-0 rounded-full border border-neutral-300 object-cover",
          className,
        )}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden={!alt}
      aria-label={alt || undefined}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide text-white",
        avatarColorClass(displayName || fullName || ""),
        className,
        textClassName,
      )}
    >
      {initials}
    </span>
  );
}
