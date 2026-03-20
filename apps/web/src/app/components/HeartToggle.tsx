import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import HeartWhite from "@/assets/heartWhite.svg?react";
import { META_ICONS } from "../icons/MetaIcon";
import { motion } from "framer-motion";

type HeartToggleProps = {
  isLiked: boolean;
  isActive: boolean;
  onToggleLike: () => void;
};

const glowVariants = {
  notLiked: {
    boxShadow: "0px 0px 0px rgba(249,115,22,0)",
  },
  liked: {
    boxShadow: "0px 0px 12px rgba(249,115,22,0.4)",
    transition: { duration: 0.3 },
  },
};

const likeVariants = {
  initial: { scale: 1 },
  liked: {
    scale: [1, 1.25, 0.95, 1],
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default function HeartToggle({
  isActive,
  isLiked,
  onToggleLike,
}: HeartToggleProps) {
  if (!isActive) return null;

  return (
    <motion.button
      type="button"
      onClick={onToggleLike}
      className="rounded-full"
      variants={likeVariants}
      initial="initial"
      animate={isLiked ? "liked" : "initial"}
      whileTap={{ scale: 0.9 }}
     
    >
      <motion.div
        variants={glowVariants}
        animate={isLiked ? "liked" : "notLiked"}
        className="rounded-full"
      >
        <CircleBadge
          bgColor="tonal"
          size="sm"
          paddingClassName=""
          className="hover:shadow-md transition-all hover:bg-orange-200"
        >
          <SvgIcon
            size="sm"
            Icon={isLiked ? META_ICONS.heartfilled : HeartWhite}
            className={`
          transition-colors duration-200
          ${isLiked ? "text-orange-500" : "text-gray-400"}
        `}
          />
        </CircleBadge>
      </motion.div>
    </motion.button>
  );
}
