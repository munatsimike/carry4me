// src/presentation/modals/UniversalModalHost.tsx
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import CustomModal from "@/app/components/CustomModal";
import type { UniversalModalState } from "../application/DialogBoxModalProvider";
import {
  ModalBody,
  ModalFooter,
  ModalSeparator,
} from "@/app/components/ModalFooter";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import { resolveModalIcon } from "./modalIcons";

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

  const icon = resolveModalIcon(modal);

  return (
    <AnimatePresence mode="wait">
      {modal && (
        <div>
          <CustomModal
            width={modal.type === "info" && modal.width ? modal.width : "lg"}
            onClose={onRequestClose}
          >
            <div className="flex flex-col">
              <div className="flex flex-col">
                <span
                  className={cn(
                    "flex min-w-0 pb-4",
                    icon ? "items-start gap-2" : "flex-col",
                  )}
                >
                  {icon}
                  <CustomText
                    textVariant="primary"
                    textSize="lg"
                    className="font-semi-medium"
                  >
                    {modal.title ?? ""}
                  </CustomText>
                </span>
                <ModalSeparator />
              </div>

              <ModalBody className="gap-3 pt-4">
                <CustomText textVariant="secondary">{modal.message}</CustomText>
                {modal.type === "info" && modal.messageDetail ? (
                  <CustomText
                    textVariant="primary"
                    className="text-neutral-800"
                  >
                    {modal.messageDetail}
                  </CustomText>
                ) : null}
              </ModalBody>

              <ModalFooter>
                {action.secondaryLabel ? (
                  <Button
                    className="w-full sm:min-w-[120px] sm:w-auto"
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
                ) : null}

                <Button
                  className="w-full sm:min-w-[120px] sm:w-auto"
                  onClick={action.onClick}
                  variant="primary"
                  size="sm"
                >
                  <CustomText textVariant="onDark">{action.label}</CustomText>
                </Button>
              </ModalFooter>
            </div>
          </CustomModal>
        </div>
      )}
    </AnimatePresence>
  );
}
