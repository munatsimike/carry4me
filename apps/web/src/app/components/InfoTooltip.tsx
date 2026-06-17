import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/app/lib/cn";

type InfoTooltipProps = {
  content: string;
  className?: string;
};

export default function InfoTooltip({ content, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("group/info relative inline-flex shrink-0", className)}
    >
      <button
        type="button"
        aria-label="More information"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "rounded-full p-0.5 text-neutral-400 transition-colors",
          "hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
        )}
      >
        <CircleHelp className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2",
          "rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-neutral-700 shadow-lg",
          "opacity-0 scale-95 transition-all duration-200 ease-out",
          "group-hover/info:pointer-events-auto group-hover/info:opacity-100 group-hover/info:scale-100",
          open && "pointer-events-auto opacity-100 scale-100",
        )}
      >
        {content}
      </span>
    </div>
  );
}
