import type { ReactNode } from "react";
import type { UniversalModalState } from "../application/DialogBoxModalProvider";

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
