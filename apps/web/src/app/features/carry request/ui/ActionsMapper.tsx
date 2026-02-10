import { INFOMODES, type InfoBlockMode } from "@/types/Ui";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type CarryRequestStatus,
  type Role,
} from "../domain/CreateCarryRequest";
import type { HandoverConfirmationState } from "../handover confirmations/domain/HandoverConfirmationState";

export const UIACTIONKEYS = {
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
  CANCEL: "CANCEL",
  PAY: "PAY",
  CONFIRM_HANDOVER: "CONFIRM_HANDOVER",
  MARK_DELIVERED: "MARK_DELIVERED",
  RELEASE_PAYMENT: "RELEASE_PAYMENT",
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

function confirmDelivery(): UIAction {
  return {
    kind: ACTIONKINDS.DELIVERY,
    variant: VARIANTS.PRIMARY,
    label: "Confirm delivery",
    key: UIACTIONKEYS.MARK_DELIVERED,
  };
}

function displayPaymentCode(): InfoBlock {
  return {
    mode: INFOMODES.DISPLAY,
    label: "Payment code",
    helperText: "Provide this code to the traveler after delivery.",
    value: "25689",
  };
}

export default function actionsMapper(
  viewerRole: Role,
  status: CarryRequestStatus,
  requestIniator: Role,
  handoverState?: HandoverConfirmationState,
): UIActions {
  switch (status) {
    case CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE:
      return pendingAcceptance(viewerRole, requestIniator);
    case CARRY_REQUEST_STATUSES.PENDING_PAYMENT:
      return pendingPayment(viewerRole);
    case CARRY_REQUEST_STATUSES.PENDING_HANDOVER:
      return pendingHandover(handoverState, viewerRole);
    case CARRY_REQUEST_STATUSES.IN_TRANSIT:
      return intransit(viewerRole);
    case CARRY_REQUEST_STATUSES.PENDING_PAYOUT:
      return pendingPayout(viewerRole);
    case CARRY_REQUEST_STATUSES.PAID_OUT:
      return paidOut();
    case CARRY_REQUEST_STATUSES.REJECTED:
      return requestRejected(viewerRole);
    case CARRY_REQUEST_STATUSES.CANCELLED:
      return requestCanceled(viewerRole);
    default:
      return {};
  }
}

function requestRejected(viewerRole: Role): UIActions {
  const label = viewerRole === ROLES.SENDER ? "Browse trips" : "Browse parcels";
  return {
    primary: {
      kind: ACTIONKINDS.NAVIGATE,
      variant: "primary",
      label: label,
      key: viewerRole === ROLES.SENDER ? "BROWSE_TRIPS" : "BROWSE_PARCELS",
    },
  };
}

function requestCanceled(viewerRole: Role): UIActions {
  const label = viewerRole === ROLES.SENDER ? "Browse trips" : "Browse parcels";
  return {
    primary: {
      kind: ACTIONKINDS.REJECT,
      variant: "primary",
      label: label,
      key: viewerRole === ROLES.SENDER ? "BROWSE_TRIPS" : "BROWSE_PARCELS",
    },
  };
}

function paidOut(): UIActions {
  return {
    infoBlock: {
      mode: INFOMODES.DISPLAY,
      displayText: {
        title: "Thank you  for using Carry4Me.",
        description:
          "Need help or suggestions? WhatsApp +31 6 5831 89  or  info@carry4me.com.",
      },
    },
  };
}
function pendingPayout(viewerRole: Role): UIActions {
  if (viewerRole === ROLES.SENDER) {
    return {
      infoBlock: {
        mode: INFOMODES.DISPLAY,
        label: "Payment code",
        helperText: "Provide this code to the traveler after delivery.",
        value: "25689",
      },
    };
  } else {
    return {
      infoBlock: {
        mode: INFOMODES.INPUT,
        label: "Enter payment code",
        helperText: "Haven’t received the code yet? Please contact the sender.",
      },

      primary: {
        kind: ACTIONKINDS.PAYOUT,
        variant: VARIANTS.PRIMARY,
        label: "Pay out",
        key: "RELEASE_PAYMENT",
      },
    };
  }
}

function intransit(viewerRole: Role): UIActions {
  if (viewerRole === ROLES.SENDER) {
    return {
      infoBlock: displayPaymentCode(),
      secondary: cancelRequest,
    };
  } else {
    return {
      primary: confirmDelivery(),
      secondary: cancelRequest,
    };
  }
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
