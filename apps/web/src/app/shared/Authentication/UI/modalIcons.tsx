import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/app/lib/cn";
import type { UniversalModalState } from "../application/DialogBoxModalProvider";

export function successCheckCircleIcon(className?: string): ReactNode {
  return (
    <CheckCircle2
      className={cn("h-6 w-6 shrink-0 text-success-600", className)}
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

/** Default icons by modal type; explicit `icon` on the payload always wins. */
export function resolveModalIcon(modal: UniversalModalState): ReactNode {
  if (!modal) return null;

  if ("icon" in modal && modal.icon) {
    return modal.icon;
  }

  switch (modal.type) {
    case "error":
      return null;
    case "confirm":
      return null;
    default:
      return null;
  }
}
