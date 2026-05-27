import { AlertCircle, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import type { UniversalModalState } from "../application/DialogBoxModalProvider";

const iconClass = "h-6 w-6 shrink-0";

/** Default icons by modal type; explicit `icon` on the payload always wins. */
export function resolveModalIcon(modal: UniversalModalState): ReactNode {
  if (!modal) return null;

  if ("icon" in modal && modal.icon) {
    return modal.icon;
  }

  switch (modal.type) {
    case "error":
      return <AlertCircle className={`${iconClass} text-red-600`} aria-hidden />;
    case "confirm":
      return modal.destructive ? (
        <AlertTriangle className={`${iconClass} text-amber-600`} aria-hidden />
      ) : null;
    default:
      return null;
  }
}
