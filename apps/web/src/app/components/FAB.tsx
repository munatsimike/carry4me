import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Package, Plane, Plus, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "../shared/Authentication/UI/hooks/useUI";
import { cn } from "@/app/lib/cn";

const fabMotion = {
  initial: { opacity: 0, y: 14, scale: 0.88 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 14, scale: 0.88 },
  transition: { type: "spring" as const, stiffness: 420, damping: 30 },
};

const FAB_SURFACE_CLASSES =
  "flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-lg shadow-slate-900/25 ring-2 ring-white transition-colors hover:bg-slate-900 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2";

interface FABProps {
  onClick?: () => void;
  to?: string;
  isAuthed: boolean;
  variant?: "trip" | "parcel";
}

const variantConfig: Record<
  NonNullable<FABProps["variant"]>,
  { label: string; Icon: LucideIcon }
> = {
  trip: { label: "Post a trip", Icon: Plane },
  parcel: { label: "Post a parcel", Icon: Package },
};

function FabIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="relative flex h-full w-full items-center justify-center">
      <Icon className="mt-1.5 h-6 w-6" strokeWidth={1.75} aria-hidden />
      <span
        className="absolute left-1/2 top-2 z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm ring-2 ring-slate-800"
        aria-hidden
      >
        <Plus className="h-3 w-3" strokeWidth={3} />
      </span>
    </span>
  );
}

export default function FAB({ onClick, to, isAuthed, variant }: FABProps) {
  const { openOverlayCount } = useUI();

  const isVisible = isAuthed && openOverlayCount === 0;
  const config = variant ? variantConfig[variant] : null;
  const label = config?.label ?? "Create";

  const icon = config ? (
    <FabIcon Icon={config.Icon} />
  ) : (
    <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden />
  );

  const fab = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="fab"
          role="presentation"
          className={cn(
            "fixed z-[60]",
            "bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4",
            "sm:bottom-6 sm:right-6",
          )}
          {...fabMotion}
        >
          {to ? (
            <Link to={to} className={FAB_SURFACE_CLASSES} aria-label={label}>
              {icon}
            </Link>
          ) : (
            <motion.button
              type="button"
              onClick={onClick}
              className={FAB_SURFACE_CLASSES}
              aria-label={label}
              whileTap={{ scale: 0.94 }}
            >
              {icon}
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(fab, document.body);
}
