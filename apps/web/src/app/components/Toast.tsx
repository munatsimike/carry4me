import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastAction = {
  label: string;
  onClick: () => void;
};

const defaultIcons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <CheckCircle2 className="h-6 w-6 text-success-600" strokeWidth={1.5} />
  ),
  error: <XCircle className="h-6 w-6 text-red-600" strokeWidth={1.5} />,
  info: <Info className="h-6 w-6 text-primary-600" strokeWidth={1.5} />,
  warning: (
    <AlertTriangle className="h-6 w-6 text-warning-600" strokeWidth={1.5} />
  ),
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  icon: React.ReactNode;
  action?: ToastAction;
};

type ToastOptions = {
  variant?: ToastVariant;
  duration?: number;
  icon?: React.ReactNode;
  action?: ToastAction;
};

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastItem, setToastItem] = useState<ToastItem | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const remove = useCallback(() => {
    clearTimer();
    setToastItem(null);
  }, [clearTimer]);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      clearTimer();

      const variant = options?.variant ?? "info";
      const duration = options?.duration ?? 6000;
      const id = uid();

      setToastItem({
        id,
        message,
        variant,
        duration,
        icon: options?.icon ?? defaultIcons[variant],
        action: options?.action,
      });

      hideTimerRef.current = window.setTimeout(() => {
        setToastItem(null);
        hideTimerRef.current = null;
      }, duration);
    },
    [clearTimer],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] sm:w-auto">
        <AnimatePresence>
          {toastItem && (
            <motion.div
              key={toastItem.id}
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className={[
                "px-5 py-2 rounded-xl shadow-sm text-sm border sm:max-w-sm",
                toastItem.variant === "success" &&
                  "bg-success-50 text-ink-primary border-success-100",
                toastItem.variant === "error" &&
                  "bg-red-50 text-ink-primary border-red-200",
                toastItem.variant === "info" &&
                  "bg-primary-50 text-ink-primary border-primary-100",
                toastItem.variant === "warning" &&
                  "bg-warning-50 text-ink-primary border-warning-100",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-center gap-3">
                {toastItem.icon}
                <span className="flex-1">{toastItem.message}</span>
                <span></span>

                {/* optional close */}
                <button
                  onClick={remove}
                  className="absolute right-3 top-1 text-ink-secondary hover:text-ink-primary"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              {toastItem.action && (
                <button
                  onClick={() => {
                    toastItem.action?.onClick();
                    remove(); // close after action
                  }}
                  className="m-2 text-sm font-medium underline"
                >
                  {toastItem.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
