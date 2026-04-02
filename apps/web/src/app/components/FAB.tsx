import { Plus } from "lucide-react";
import { useScrollDirection } from "../shared/Authentication/UI/hooks/useScrollDirection";
import { AnimatePresence, motion } from "framer-motion";

export default function FAB({ onClick }: { onClick?: () => void }) {
  const scrollDirection = useScrollDirection();

  const visible = scrollDirection === "up";

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="fab"
          type="button"
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={onClick}
          className="fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg ring-2 ring-indigo-200 transition active:scale-95 sm:hidden"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
