import { Plus } from "lucide-react";
import { useScrollDirection } from "../shared/Authentication/UI/hooks/useScrollDirection";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "../shared/Authentication/UI/hooks/useUI";

export default function FAB({
  onClick,
  isAuthed,
}: {
  onClick?: () => void;
  isAuthed: boolean;
}) {
  const scrollDirection = useScrollDirection();
  const { openOverlayCount } = useUI();
  const visible = scrollDirection === "up" && openOverlayCount === 0;

  return (
    <AnimatePresence>
      {visible && isAuthed && (
        <motion.button
          key="fab"
          type="button"
          initial={{ opacity: 0, y: 3, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 3, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          onClick={onClick}
          className="fixed bottom-20 right-4 z-50 flex h-15 w-15 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg ring-2 ring-indigo-200 transition active:scale-95 sm:hidden"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
