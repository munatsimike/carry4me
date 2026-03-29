import { motion } from "framer-motion";
import { CloseBackBtn } from "./CloseBtn";
import { useMediaQuery } from "../shared/Authentication/UI/hooks/useMediaQuery";

type Width = "sm" | "md" | "lg" | "xl" | "2xl";

type Props = {
  width?: Width;
  children: React.ReactNode;
  onClose: () => void;
};

const sizes: Record<Width, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};
export default function CustomModal({
  children,
  onClose,
  width = "2xl",
}: Props) {
  const isMobile = useMediaQuery();

  const modalAnimation = isMobile
    ? {
        initial: { opacity: 0, y: -100 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -80 },
        transition: { duration: 0.28, ease: "easeOut" as const },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 24 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.94, y: 32 },
        transition: { duration: 0.24, ease: "easeOut" as const },
      };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 z-[100] bg-slate-600/40 backdrop-blur-[1px]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className={`relative z-[110] w-[97vw] sm:w-full ${sizes[width]} max-h-[90vh] rounded-t-2xl sm:rounded-2xl bg-white shadow-xl p-2 border border-neutral-300`}
        initial={modalAnimation.initial}
        animate={modalAnimation.animate}
        exit={modalAnimation.exit}
        transition={modalAnimation.transition}
      >
        <CloseBackBtn onClose={onClose} />
     {children}
      </motion.div>
    </motion.div>
  );
}
