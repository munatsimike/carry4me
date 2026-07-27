import {
  CircleCheck,
  CreditCard,
  Package,
  Send,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { progress } from "@/types/Ui";
import { ROLES, type Role } from "../domain/CreateCarryRequest";

export const progressStepIcons: Record<1 | 2 | 3 | 4 | 5 | 6, LucideIcon> = {
  1: Send,
  2: CircleCheck,
  3: CreditCard,
  4: Package,
  5: Truck,
  6: Wallet,
};

export function getProgressStageLabel(
  step: 1 | 2 | 3 | 4 | 5 | 6,
  viewerRole: Role,
): string {
  if (step === 6) {
    return viewerRole === ROLES.TRAVELER ? "Paid out" : "Released";
  }

  return progress[step];
}
