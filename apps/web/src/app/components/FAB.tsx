import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollDirection } from "../shared/Authentication/UI/hooks/useScrollDirection";
import { useUI } from "../shared/Authentication/UI/hooks/useUI";

// Animation variants for FAB entrance/exit
const FAB_ANIMATION_VARIANTS = {
  initial: { opacity: 0, y: 3, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 3, scale: 0.95 },
  transition: { duration: 0.4, ease: "easeInOut" },
};

// Tailwind classes for FAB styling
const FAB_BUTTON_CLASSES =
  "p-3 fixed bottom-20 right-4 z-50 flex h-15 w-15 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg ring-2 ring-indigo-200 transition active:scale-95 sm:hidden";

const FAB_ICON_CLASSES = "h-7 w-7";

interface FABProps {
  onClick?: () => void;
  isAuthed: boolean;
}

export default function FAB({ onClick, isAuthed }: FABProps) {
  const scrollDirection = useScrollDirection();
  const { openOverlayCount } = useUI();

  // Show FAB only when scrolling up and no overlays are open
  const isVisible = scrollDirection === "up" && openOverlayCount === 0;

  return (
    <AnimatePresence>
      {isVisible && isAuthed && (
        <motion.button
          key="fab"
          type="button"
          {...FAB_ANIMATION_VARIANTS}
          onClick={onClick}
          className={FAB_BUTTON_CLASSES}
        >
          <Plus className={FAB_ICON_CLASSES} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
