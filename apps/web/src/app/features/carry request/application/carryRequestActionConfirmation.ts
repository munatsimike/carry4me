import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type CarryRequestStatus,
  type Role,
} from "../domain/CreateCarryRequest";
import { UIACTIONKEYS, type UIActionKey } from "../ui/ActionsMapper";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export type CarryRequestActionConfirmContext = {
  viewerRole: Role;
  status: CarryRequestStatus;
};

const ACTIONS_WITHOUT_CONFIRM: ReadonlySet<UIActionKey> = new Set([
  UIACTIONKEYS.BROWSE_TRIPS,
  UIACTIONKEYS.BROWSE_PARCELS,
  UIACTIONKEYS.PAY,
]);

function getConfirmOptions(
  actionKey: UIActionKey,
  context: CarryRequestActionConfirmContext,
): ConfirmOptions | null {
  switch (actionKey) {
    case UIACTIONKEYS.ACCEPT:
      return {
        title: "Accept this request?",
        message:
          "You are committing to carry this parcel. The sender will be notified and asked to pay within the payment window.",
        confirmText: "Yes, accept request",
        cancelText: "Not now",
      };

    case UIACTIONKEYS.REJECT:
      return {
        title: "Reject this request?",
        message:
          "This will decline the carry request. The other party will be notified and this cannot be undone.",
        confirmText: "Yes, reject request",
        cancelText: "Keep request",
        destructive: true,
      };

    case UIACTIONKEYS.CANCEL: {
      const senderPaidCancellation =
        context.viewerRole === ROLES.SENDER &&
        context.status === CARRY_REQUEST_STATUSES.PENDING_HANDOVER;

      return {
        title: "Cancel this request?",
        message: senderPaidCancellation
          ? "This will cancel the request and process a partial refund. The service fee is non-refundable. Continue?"
          : "This action cancels the carry request and cannot be undone. You can send a new request later.",
        confirmText: "Yes, cancel request",
        cancelText: "Keep request",
        destructive: true,
      };
    }

    case UIACTIONKEYS.CONFIRM_HANDOVER:
      return {
        title: "Confirm handover?",
        message:
          context.viewerRole === ROLES.SENDER
            ? "Confirm that you have handed over the package to the traveler. Both parties must confirm."
            : "Confirm that you received the package from sender. Both parties must confirm.",
        confirmText: "Yes, confirm handover",
        cancelText: "Not yet",
      };

    case UIACTIONKEYS.MARK_DELIVERED:
      return {
        title: "Confirm delivery?",
        message:
          "Have you successfully delivered the package? Only confirm once the recipient has received it.",
        confirmText: "Yes, confirm delivery",
        cancelText: "Not yet",
      };

    case UIACTIONKEYS.RELEASE_PAYMENT:
      return {
        title: "Release payment?",
        message:
          "This will release the payment to your account and mark the request as completed.",
        confirmText: "Yes, release payment",
        cancelText: "Not yet",
      };

    case UIACTIONKEYS.RESEND_DELIVERY_OTP:
      return {
        title: "Resend payment code?",
        message:
          "A new 6-digit code will be sent to your email. Any previous code will stop working.",
        confirmText: "Send new code",
        cancelText: "Cancel",
      };

    default:
      return null;
  }
}

export async function confirmCarryRequestAction(
  actionKey: UIActionKey,
  context: CarryRequestActionConfirmContext,
  confirm: ConfirmFn,
): Promise<boolean> {
  if (ACTIONS_WITHOUT_CONFIRM.has(actionKey)) {
    return true;
  }

  const options = getConfirmOptions(actionKey, context);
  if (!options) {
    return true;
  }

  return confirm(options);
}
