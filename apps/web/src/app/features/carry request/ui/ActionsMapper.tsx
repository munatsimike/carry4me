import { INFOMODES, ROLES, type InfoBlockMode, type Role } from "@/types/Ui";
import type { CarryRequestStatus } from "../domain/CreateCarryRequest";

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
};

const rejectRequest: UIAction = {
  kind: ACTIONKINDS.REJECT,
  variant: VARIANTS.DANGER,
  label: "Reject request",
};

const cancelRequest: UIAction = {
  kind: ACTIONKINDS.CANCEL,
  variant: VARIANTS.DANGER,
  label: "Cancel request",
};

const makePayment: UIAction = {
  kind: ACTIONKINDS.PAY,
  variant: VARIANTS.PRIMARY,
  label: "Make payment",
};

const confirmHandover: UIAction = {
  kind: ACTIONKINDS.HANDOVER,
  variant: VARIANTS.PRIMARY,
  label: "Confirm handover",
};

function confirmDelivery(): UIAction {
  return {
    kind: ACTIONKINDS.DELIVERY,
    variant: VARIANTS.PRIMARY,
    label: "Confirm delivery",
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
): UIActions {
  switch (status) {
    case "PENDING_ACCEPTANCE":
      return pendingAcceptance(viewerRole, requestIniator);
    case "PENDING_PAYMENT":
      return pendingPayment(viewerRole);
    case "PENDING_HANDOVER":
      return pendingHandover();
    case "IN_TRANSIT":
      return intransit(viewerRole);
    case "PENDING_PAYOUT":
      return pendingPayout(viewerRole);
    case "PAID_OUT":
      return paidOut();
    case "REJECTED":
      return requestRejected(viewerRole);
    case "CANCELLED":
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

function pendingHandover(): UIActions {
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
