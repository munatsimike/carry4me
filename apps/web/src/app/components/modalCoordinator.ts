type ActiveModal = {
  id: string;
  requestClose: () => void;
  closed: Promise<void>;
  resolveClosed: () => void;
};

let activeModal: ActiveModal | null = null;

function registerModal(id: string, requestClose: () => void): ActiveModal {
  let resolveClosed!: () => void;
  const closed = new Promise<void>((resolve) => {
    resolveClosed = resolve;
  });

  const entry: ActiveModal = {
    id,
    requestClose,
    closed,
    resolveClosed,
  };

  activeModal = entry;
  return entry;
}

/** Close any other open modal and wait for it to finish. */
export async function waitForModalSlot(id: string): Promise<void> {
  if (activeModal?.id === id) {
    return;
  }

  if (activeModal) {
    const previous = activeModal;
    previous.requestClose();
    await previous.closed;
  }
}

/** Mark this modal as the active one after the slot is free. */
export function claimModalSlot(id: string, requestClose: () => void) {
  if (activeModal?.id === id) {
    return;
  }

  registerModal(id, requestClose);
}

export function releaseModal(id: string) {
  if (activeModal?.id !== id) {
    return;
  }

  activeModal.resolveClosed();
  activeModal = null;
}
