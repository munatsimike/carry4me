import { CheckCircle2, Info, XCircle } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

const defaultIcons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <CheckCircle2 className="h-5 w-5 text-success-600" strokeWidth={1.5} />
  ),
  error: <XCircle className="h-5 w-5 text-red-600" strokeWidth={1.5} />,
  info: <Info className="h-5 w-5 text-primary-600" strokeWidth={1.5} />,
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  icon?: React.ReactNode;
};

type ToastContextValue = {
  toast: (
    message: string,
    opts?: Partial<Pick<ToastItem, "variant" | "duration">>,
    icon?: React.ReactNode,
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (
      message: string,
      opts?: Partial<Pick<ToastItem, "variant" | "duration">>,
      icon?: React.ReactNode,
    ) => {
      const id = uid();
      const duration = opts?.duration ?? 3000;
      const variant = opts?.variant ?? "info";

      setToasts((prev) => [
        ...prev,
        { id, message, variant, duration, icon: icon ?? defaultIcons[variant] },
      ]);
      window.setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast viewport: top center */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "px-4 py-3 rounded-xl shadow-sm text-sm border",
              "transition-all duration-300",
              t.variant === "success" &&
                "bg-success-50/20 text-ink-primary border border-success-50 shadow:success-200",
              t.variant === "error" && "bg-red-600/20 border-red-700",
              t.variant === "info" &&
                "bg-primary-50/30 text-ink-primary border-primary-100",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="flex items-center gap-2">
              {t.icon}
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
