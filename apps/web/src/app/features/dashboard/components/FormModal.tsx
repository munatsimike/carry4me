// resuable container for creating trips and parcels

import CustomModal from "@/app/components/CustomModal";
import { motion } from "framer-motion";

type FormModalProps = {
  children: React.ReactNode;
  onClose: (v: boolean) => void;
  onSubmit: () => void;
};

export default function FormModal({
  children,
  onClose,
  onSubmit,
}: FormModalProps) {
  return (
    <CustomModal onClose={() => onClose(false)}>
      <form id="tripForm" onSubmit={onSubmit}>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="flex flex-col px-4"
        >
          {children}
        </motion.div>
      </form>
    </CustomModal>
  );
}
