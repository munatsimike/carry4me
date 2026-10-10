import { INFOMODES, type InfoBlockMode } from "@/types/Ui";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type CarryRequestStatus,
  type Role,
} from "../domain/CreateCarryRequest";
import type { HandoverConfirmationState } from "../handover confirmations/domain/HandoverConfirmationState";
import {
  canReleasePayoutAtHandover,
  senderPaymentCodeHelperText,
} from "@/app/shared/listings/paymentPreference";

export const UIACTIONKEYS = {
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
  CANCEL: "CANCEL",
  PAY: "PAY",
  CONFIRM_HANDOVER: "CONFIRM_HANDOVER",
  MARK_DELIVERED: "MARK_DELIVERED",
  RELEASE_PAYMENT: "RELEASE_PAYMENT",
  RESEND_DELIVERY_OTP: "RESEND_DELIVERY_OTP",
  BROWSE_TRIPS: "BROWSE_TRIPS",
  BROWSE_PARCELS: "BROWSE_PARCELS",
} as const;
export type UIActionKey = (typeof UIACTIONKEYS)[keyof typeof UIACTIONKEYS];

const VARIANTS = {
  PRIMARY: "primary",
  DANGER: "danger",
};
type Variant = (typeof VARIANTS)[keyof typeof VARIANTS];

type DisplayText = {
  title: string;
  description: string;
};

const ACTIONKINDS = {
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
  CANCEL: "CANCEL",
  PAY: "PAY",
  HANDOVER: "HANDOVER",
  PAYOUT: "PAYOUT",
  DELIVERY: "DELIVERY",
  NAVIGATE: "NAVIGATE",
};

type ActionKind = (typeof ACTIONKINDS)[keyof typeof ACTIONKINDS];
type InfoBlock = {
  mode: InfoBlockMode;
  helperText?: string;
  label?: string;
  value?: string;
  varant?: Variant;
  displayText?: DisplayText;
};

type UIAction = {
  kind: ActionKind;
  variant: Variant;
  label: string;
  helperText?: string;
  key: UIActionKey;
};

export type UIActions = {
  primary?: UIAction;
  secondary?: UIAction;
  infoBlock?: InfoBlock;
};

const accepRequest: UIAction = {
  kind: ACTIONKINDS.ACCEPT,
  variant: VARIANTS.PRIMARY,
  label: "Accept request",
  key: UIACTIONKEYS.ACCEPT,
};

const rejectRequest: UIAction = {
  kind: ACTIONKINDS.REJECT,
  variant: VARIANTS.DANGER,
  label: "Reject request",
  key: UIACTIONKEYS.REJECT,
};

const cancelRequest: UIAction = {
  kind: ACTIONKINDS.CANCEL,
  variant: VARIANTS.DANGER,
  label: "Cancel request",
  key: UIACTIONKEYS.CANCEL,
};

const makePayment: UIAction = {
  kind: ACTIONKINDS.PAY,
  variant: VARIANTS.PRIMARY,
  label: "Make payment",
  key: UIACTIONKEYS.PAY,
};

const confirmHandover: UIAction = {
  kind: ACTIONKINDS.HANDOVER,
  variant: VARIANTS.PRIMARY,
  label: "Confirm handover",
  key: UIACTIONKEYS.CONFIRM_HANDOVER,
};

const resendDeliveryCode: UIAction = {
  kind: ACTIONKINDS.PAYOUT,
  variant: VARIANTS.PRIMARY,
  label: "Resend code",
  key: UIACTIONKEYS.RESEND_DELIVERY_OTP,
};

function confirmDelivery(): UIAction {
  return {
    kind: ACTIONKINDS.DELIVERY,
    variant: VARIANTS.PRIMARY,
    label: "Confirm delivery",
    key: UIACTIONKEYS.MARK_DELIVERED,
  };
}

function displayPaymentCodeReady(paymentPreference?: string): InfoBlock {
  return {
    mode: INFOMODES.DISPLAY,
    label: "Payment code",
    helperText: senderPaymentCodeHelperText(paymentPreference),
  };
}

export default function actionsMapper(
  viewerRole: Role,
  status: CarryRequestStatus,
  requestIniator: Role,
  handoverState?: HandoverConfirmationState,
  paymentPreference?: string,
  paymentReleased = false,
  deliveryConfirmed = false,
): UIActions {
  switch (status) {
    case CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE:
      return pendingAcceptance(viewerRole, requestIniator);
    case CARRY_REQUEST_STATUSES.PENDING_PAYMENT:
      return pendingPayment(viewerRole);
    case CARRY_REQUEST_STATUSES.PENDING_HANDOVER:
      return pendingHandover(handoverState, viewerRole);
    case CARRY_REQUEST_STATUSES.IN_TRANSIT:
      return intransit(viewerRole, paymentPreference, paymentReleased);
    case CARRY_REQUEST_STATUSES.PENDING_PAYOUT:
      return pendingPayout(viewerRole, paymentPreference);
    case CARRY_REQUEST_STATUSES.PAID_OUT:
      return paidOut(viewerRole, paymentPreference, deliveryConfirmed);
    case CARRY_REQUEST_STATUSES.REJECTED:
      return requestRejected();
    case CARRY_REQUEST_STATUSES.CANCELLED:
     return {};
    case CARRY_REQUEST_STATUSES.EXPIRED:
      return {};
    default:
      return {};
  }
}

function requestRejected(): UIActions {
  return {};
}

/**function requestCanceled(viewerRole: Role): UIActions {
  const label = viewerRole === ROLES.SENDER ? "Browse trips" : "Browse parcels";
  return {
    primary: {
      kind: ACTIONKINDS.REJECT,
      variant: "primary",
      label: label,
      key: viewerRole === ROLES.SENDER ? "BROWSE_TRIPS" : "BROWSE_PARCELS",
    },
  };
}**/

function awaitingDeliveryAfterPayout(viewerRole: Role): UIActions {
  if (viewerRole === ROLES.TRAVELER) {
    return {
      primary: confirmDelivery(),
    };
  }

  return {};
}

function paidOut(
  viewerRole: Role,
  paymentPreference?: string,
  deliveryConfirmed = false,
): UIActions {
  if (canReleasePayoutAtHandover(paymentPreference) && !deliveryConfirmed) {
    return awaitingDeliveryAfterPayout(viewerRole);
  }

  return {};
}
function pendingPayout(
  viewerRole: Role,
  paymentPreference?: string,
): UIActions {
  if (viewerRole === ROLES.SENDER) {
    return {
      secondary: resendDeliveryCode,
      infoBlock: {
        mode: INFOMODES.DISPLAY,
        label: "Payment code",
        helperText: senderPaymentCodeHelperText(paymentPreference),
      },
    };
  } else {
    return {
      infoBlock: {
        mode: INFOMODES.INPUT,
        label: "Enter payment code",
        helperText: "Haven’t received the code yet? Contact the sender.",
      },

      primary: {
        kind: ACTIONKINDS.PAYOUT,
        variant: VARIANTS.PRIMARY,
        label: "Release payout",
        key: "RELEASE_PAYMENT",
      },
    };
  }
}

function intransit(
  viewerRole: Role,
  paymentPreference?: string,
  paymentReleased = false,
): UIActions {
  if (canReleasePayoutAtHandover(paymentPreference)) {
    if (paymentReleased) {
      return awaitingDeliveryAfterPayout(viewerRole);
    }

    return pendingPayout(viewerRole, paymentPreference);
  }

  if (viewerRole === ROLES.SENDER) {
    return {
      infoBlock: displayPaymentCodeReady(paymentPreference),
      secondary: resendDeliveryCode,
    };
  }

  return {
    primary: confirmDelivery(),
  };
}

function pendingHandover(
  handoverState: HandoverConfirmationState | undefined,
  viewerRole: Role,
): UIActions {
  if (
    (handoverState &&
      viewerRole === ROLES.SENDER &&
      handoverState?.senderConfirmed) ||
    (viewerRole === ROLES.TRAVELER && handoverState?.travelerConfirmed)
  ) {
    return {
      secondary: cancelRequest,
    };
  }
  return {
    primary: confirmHandover,
    secondary: cancelRequest,
  };
}

function pendingPayment(viewerRole: Role): UIActions {
  if (viewerRole === ROLES.SENDER) {
    return {
      primary: makePayment,
      secondary: cancelRequest,
    };
  } else {
    return {
      secondary: cancelRequest,
    };
  }
}

function pendingAcceptance(viewerRole: Role, requestIniator: Role): UIActions {
  if (viewerRole !== requestIniator) {
    return {
      primary: accepRequest,
      secondary: rejectRequest,
    };
  }

  if (viewerRole === requestIniator) {
    return {
      secondary: cancelRequest,
    };
  }
  return {};
}
