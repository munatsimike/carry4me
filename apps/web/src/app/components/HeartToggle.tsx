import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import { useState } from "react";
import HeartWhite from "@/assets/heartWhite.svg?react";
import HeartFilled from "@/assets/heartFilled.svg?react";

export default function HeartToggle() {
  const [isLiked, setIsLiked] = useState(false);
  return (
    <button
      className="rounded-full"
      type="button"
      onClick={() => setIsLiked((v) => !v)}
    >
      <CircleBadge className="hover:shadow-md" bgColor="neutral">
        <SvgIcon size={"lg"} Icon={isLiked ? HeartFilled : HeartWhite} />
      </CircleBadge>
    </button>
  );
}
