import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { CloseBackBtn } from "./CloseBtn";
import { useMediaQuery } from "../shared/Authentication/UI/hooks/useMediaQuery";
import { useUI } from "../shared/Authentication/UI/hooks/useUI";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { claimModalSlot, releaseModal, waitForModalSlot } from "./modalCoordinator";

type Width = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

type Props = {
  width?: Width;
  children: React.ReactNode;
  onClose: () => void;
  /** When false, the modal panel does not scroll (e.g. sign-in). */
  scrollable?: boolean;
  /** When false, backdrop clicks do not close the modal (e.g. payment). */
  closeOnBackdropClick?: boolean;
  /** When true, the panel has no chrome (border/padding/bg) so the child fills it flush (e.g. listing preview). */
  bare?: boolean;
};

const sizes: Record<Width, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export default function CustomModal({
  children,
  onClose,
  width = "2xl",
  scrollable = true,
  closeOnBackdropClick = true,
  bare = false,
}: Props) {
  const modalId = useId();
  const isMobile = useMediaQuery();
  const [isReady, setIsReady] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const isClosingRef = useRef(false);

  onCloseRef.current = onClose;
  isClosingRef.current = isClosing;

  const { incrementOverlayCount, decrementOverlayCount } = useUI();

  const modalAnimation = isMobile
    ? {
        initial: { opacity: 0, y: -100 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -80 },
        transition: { duration: 0.28, ease: "easeOut" as const },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 24 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.94, y: 32 },
        transition: { duration: 0.24, ease: "easeOut" as const },
      };

  const closeDurationMs = Math.max(
    modalAnimation.transition.duration * 1000,
    300,
  );

  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;

    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      onCloseRef.current();
    }, closeDurationMs);
  }, [closeDurationMs]);

  useEffect(() => {
    if (!isMobile) return;

    incrementOverlayCount();

    return () => {
      decrementOverlayCount();
    };
  }, [isMobile, incrementOverlayCount, decrementOverlayCount]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await waitForModalSlot(modalId);
      if (cancelled) return;

      claimModalSlot(modalId, requestClose);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
      releaseModal(modalId);
    };
  }, [modalId, requestClose]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center px-2 py-2 sm:items-center sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 z-[100] bg-slate-600/40 backdrop-blur-[1px]"
        onClick={closeOnBackdropClick ? requestClose : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className={`relative z-[110] w-full ${sizes[width]} ${
          bare
            ? "rounded-t-3xl sm:rounded-3xl"
            : "rounded-t-2xl border border-neutral-300 bg-white px-4 py-4 shadow-xl sm:rounded-2xl sm:px-6 sm:py-4"
        } ${
          scrollable
            ? "max-h-[calc(100vh-1rem)] overflow-y-auto sm:max-h-[calc(100vh-2rem)]"
            : "max-h-none overflow-visible"
        }`}
        initial={modalAnimation.initial}
        animate={isClosing ? modalAnimation.exit : modalAnimation.animate}
        exit={modalAnimation.exit}
        transition={modalAnimation.transition}
      >
        <CloseBackBtn onClose={requestClose} />
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
