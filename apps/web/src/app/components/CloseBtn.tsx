import { motion } from "framer-motion";
import { X } from "lucide-react";

type CloseBackBtnProps = {
  onClose: (b: boolean) => void;
};
export function CloseBackBtn({ onClose }: CloseBackBtnProps) {
  return (
    <div className="absolute top-2 right-2">
      <motion.button
      whileHover={{scale:1.05}}
      animate={{duration:0.2, ease:"easeInOut"}}
        type="button"
        onClick={() => onClose(false)}
        className="flex items-center justify-center text-neutral-800 hover:black hover:bg-neutral-100 rounded-lg  transition-all p-1 "
      >
        <X className="h-5 w-5 text-ink-neutral-900" />
      </motion.button>
    </div>
  );
}
