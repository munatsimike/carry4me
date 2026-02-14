import CustomText from "@/components/ui/CustomText";
import {CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
type ToastVariant = "success" | "error" | "info";

const variants: Record<ToastVariant, string> = {
  success: "bg-success-50/20 border border-success-50 shadow:success-200",
  error: "bg-red-600 text-white",
  info: "bg-white text-ink-primary border",
};

type ToastProps = {
  message: string | null;
  isVisible: boolean;
  onClose: () => void;
  toastVariant?: ToastVariant;
  duration?: number;
  icon?: React.ReactNode;
};

export default function Toast({
  message,
  isVisible,
  onClose,
  toastVariant = "success",
  duration = 5000,
  icon = <CheckCircle2 className="h-5 w-5 text-success-600" strokeWidth={1.5} />,
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  return (
    <div
      className={`fixed inset-0 flex items-start pt-8 justify-center pointer-events-none z-[100]`}
    >
      <div
        className={`backdrop-blur-md pointer-events-auto px-6 py-2 rounded-xl shadow-sm ${variants[toastVariant]} text-sm transition-all duration-300
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <span className="inline-flex gap-2 items-center">
          {icon} <CustomText textVariant="primary">{message}</CustomText>
        </span>
      </div>
    </div>
  );
}
