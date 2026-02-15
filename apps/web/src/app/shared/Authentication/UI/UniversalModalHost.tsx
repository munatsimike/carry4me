// src/presentation/modals/UniversalModalHost.tsx

// UniversalModalHost.tsx
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CustomModal from "@/app/components/CustomModal";
import type { UniversalModalState } from "../application/DialogBoxModalProvider";
import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";

export function UniversalModalHost({
  modal,
  onRequestClose,
}: {
  modal: UniversalModalState;
  onRequestClose: () => void;
}) {
  // ESC close (host stays mounted so exit works)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onRequestClose]);

  const primary = (() => {
    switch (modal?.type) {
      case "error":
        return { label: "Retry", onClick: modal.onRetry ?? onRequestClose };
      case "confirm":
        return { label: "Confirm", onClick: modal.onConfirm ?? modal.onCancel };
      default:
        return { label: "Close", onClick: onRequestClose };
    }
  })();

  return (
    <AnimatePresence mode="wait">
      {modal && (
        <div>
          <CustomModal width="md" onClose={onRequestClose}>
            {/* Render modal body based on type */}
            <CustomText textVariant="primary">{modal.message}</CustomText>

            <LineDivider />
            {/* Add your buttons here like before */}
            <div className="mt-5 flex justify-end gap-8">
              <Button onClick={onRequestClose} variant={"neutral"} size={"md"}>
                <CustomText>{"Cancel"}</CustomText>
              </Button>
              <Button onClick={primary.onClick} variant={"primary"} size={"md"}>
                <CustomText textVariant="onDark">{primary.label}</CustomText>
              </Button>
            </div>
          </CustomModal>
        </div>
      )}
    </AnimatePresence>
  );
}
