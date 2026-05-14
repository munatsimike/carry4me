import { Package, Plane, Plus } from "lucide-react";
import { AnimatePresence} from "framer-motion";
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
  "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-white shadow-xl transition active:scale-95 sm:hidden";
interface FABProps {
  onClick?: () => void;
  isAuthed: boolean;
  variant?: "trip" | "parcel";
}

export default function FAB({ onClick, isAuthed, variant }: FABProps) {
  const scrollDirection = useScrollDirection();
  const { openOverlayCount } = useUI();

  // Show FAB only when scrolling up and no overlays are open
  const isVisible = scrollDirection === "up" && openOverlayCount === 0;

  const BadgeIcon =
    variant === "parcel" ? Package : variant === "trip" ? Plane : undefined;

  return (
    <AnimatePresence>
      {isVisible && isAuthed && (
        <button
          key="fab"
          type="button"
          {...FAB_ANIMATION_VARIANTS}
          onClick={onClick}
          className={FAB_BUTTON_CLASSES}
        >
          {BadgeIcon && (
            <div className="relative flex items-center justify-center">
              <BadgeIcon className="h-7 w-7" strokeWidth={1.7} />

              <div className="absolute -right-2 -top-2 rounded-full bg-slate-700  ring-4 ring-slate-700">
                <Plus className="h-4 w-4" strokeWidth={3} />
              </div>
            </div>
          )}
        </button>
      )}
    </AnimatePresence>
  );
}
