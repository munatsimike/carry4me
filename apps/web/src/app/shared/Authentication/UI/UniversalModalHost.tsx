// src/presentation/modals/UniversalModalHost.tsx
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
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
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onRequestClose]);

  const action = (() => {
    switch (modal?.type) {
      case "error":
        if (modal.onLogin) {
          return {
            label: modal.label ?? "Sign in",
            onClick: () => {
              modal.onLogin?.();
              onRequestClose();
            },
          };
        }

        return {
          label: modal.label ?? "Close",
          onClick: () => {
            modal.onClose?.();
            onRequestClose();
          },
        };

      case "confirm":
        return {
          label: modal.confirmText ?? "Confirm",
          onClick: modal.onConfirm ?? modal.onCancel,
          secondaryLabel: modal.cancelText ?? "Cancel",
          secondaryAction: modal.onCancel,
        };

      case "info":
        return {
          label: modal.label ?? "Close",
          onClick: () => {
            modal.onClick?.();
            onRequestClose();
          },
          secondaryLabel: modal.secondaryLabel,
          secondaryAction: modal.secondaryAction,
        };

      default:
        return { label: "Close", onClick: onRequestClose };
    }
  })();

  return (
    <AnimatePresence mode="wait">
      {modal && (
        <div>
          <CustomModal width="lg" onClose={onRequestClose}>
            <div className="p-4">
              <span className="flex flex-col gap-2">
                <span className="flex gap-2 items-center">
                  {modal.icon ?? ""}
                  <CustomText
                    textVariant="primary"
                    textSize="lg"
                    className="font-semi-medium"
                  >
                    {modal.title ?? ""}
                  </CustomText>
                </span>

                <CustomText textVariant="secondary">{modal.message}</CustomText>
              </span>

              <LineDivider />

              <div className="mt-5 flex justify-end gap-8">
                {action.secondaryAction && (
                  <Button
                    className="min-w-[100px]"
                    onClick={() => {
                      action.secondaryAction?.();
                      onRequestClose();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <CustomText textVariant="primary">
                      {action.secondaryLabel}
                    </CustomText>
                  </Button>
                )}

                <Button
                  className="min-w-[100px]"
                  onClick={action.onClick}
                  variant="primary"
                  size="sm"
                >
                  <CustomText textVariant="onDark">{action.label}</CustomText>
                </Button>
              </div>
            </div>
          </CustomModal>
        </div>
      )}
    </AnimatePresence>
  );
}
