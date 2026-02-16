/// src/presentation/modals/UniversalModalProvider.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  normalizeSupabaseError,
  type NormalizedError,
} from "./normalizeSupabaseError";
import { UniversalModalHost } from "../UI/UniversalModalHost";


type ErrorModalPayload = NormalizedError & {
  type: "error";
  onRetry?: () => void;
  onLogin?: () => void;
};

type ConfirmModalPayload = {
  type: "confirm";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

type InfoModalPayload = {
  type: "info";
  title: string;
  message: string;
  buttonText?: string;
  onClose?: () => void;
};

export type UniversalModalState =
  | null
  | ErrorModalPayload
  | ConfirmModalPayload
  | InfoModalPayload;

type ConfirmOptions = Omit<ConfirmModalPayload, "type" | "onConfirm"> & {
  confirmText?: string;
  cancelText?: string;
};

type UniversalModalContextValue = {
  modal: UniversalModalState;
  openError: (payload: Omit<ErrorModalPayload, "type">) => void;
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void;
  openConfirm: (payload: Omit<ConfirmModalPayload, "type">) => void;

  // ergonomic helpers
  showSupabaseError: (
    err: any,
    status?: number | null,
    opts?: { onRetry?: () => void; onLogin?: () => void },
  ) => void;

  // Promise-based confirm (super nice for delete/payment flows)
  confirm: (opts: ConfirmOptions) => Promise<boolean>;

  closeModal: () => void;
};

const UniversalModalContext = createContext<UniversalModalContextValue | null>(
  null,
);

export function UniversalModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modal, setModal] = useState<UniversalModalState>(null);

  // for Promise-based confirm()
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeModal = () => {
    setModal(null);

    // if a confirm modal is dismissed without explicit action, resolve false
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
      confirmResolverRef.current = null;
    }
  };

  const value = useMemo<UniversalModalContextValue>(() => {
    const openError: UniversalModalContextValue["openError"] = (payload) => {
      setModal({ type: "error", ...payload });
    };

    const openInfo: UniversalModalContextValue["openInfo"] = (payload) => {
      setModal({ type: "info", ...payload });
    };

    const openConfirm: UniversalModalContextValue["openConfirm"] = (
      payload,
    ) => {
      setModal({ type: "confirm", ...payload });
    };

    const showSupabaseError: UniversalModalContextValue["showSupabaseError"] = (
      err,
      status,
      opts,
    ) => {
      const normalized = normalizeSupabaseError(err, status);
      setModal({
        type: "error",
        ...normalized,
        onRetry: opts?.onRetry,
        onLogin: opts?.onLogin,
      });
    };

    const confirm: UniversalModalContextValue["confirm"] = (opts) => {
      return new Promise<boolean>((resolve) => {
        confirmResolverRef.current = resolve;

        setModal({
          type: "confirm",
          title: opts.title,
          message: opts.message,
          confirmText: opts.confirmText ?? "Confirm",
          cancelText: opts.cancelText ?? "Cancel",
          destructive: opts.destructive ?? false,
          onConfirm: () => {
            resolve(true);
            confirmResolverRef.current = null;
            setModal(null);
          },
          onCancel: () => {
            resolve(false);
            confirmResolverRef.current = null;
            setModal(null);
          },
        });
      });
    };

    return {
      modal,
      openError,
      openInfo,
      openConfirm,
      showSupabaseError,
      confirm,
      closeModal,
    };
  }, [modal]);

  return (
    <UniversalModalContext.Provider value={value}>
      {children}

      {/* One host mounts all modal UIs */}
      <UniversalModalHost modal={modal} onRequestClose={closeModal} />
    </UniversalModalContext.Provider>
  );
}

export function useUniversalModal() {
  const ctx = useContext(UniversalModalContext);
  if (!ctx)
    throw new Error(
      "useUniversalModal must be used within UniversalModalProvider",
    );
  return ctx;
}
