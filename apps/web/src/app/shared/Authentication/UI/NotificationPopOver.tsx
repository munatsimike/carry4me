import LineDivider from "@/app/components/LineDivider";
import type { CarryRequestNotification } from "@/app/features/carry request/carry request events/domain/CarryRequestNotification";
import { formatRelativeTime } from "@/app/features/dashboard/application/formatRelativeTime";
import { cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type PopoverProps = {
  notifications: CarryRequestNotification[];
  onClosePopOver: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export default function NotificationPopover({
  notifications,
  onClosePopOver,
  triggerRef,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const initialCount = 4;
  const [count, setCount] = useState(initialCount);

  const visibleNotifications = notifications.slice(0, count);
  const isExpanded = count >= notifications.length;

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClosePopOver(false);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      const clickedInsidePopover = !!ref.current?.contains(target);
      const clickedTrigger = !!triggerRef.current?.contains(target);

      if (!clickedInsidePopover && !clickedTrigger) {
        onClosePopOver(false);
      }
    }

    function handleScroll(event: Event) {
      if (!ref.current) return;

      if (ref.current.contains(event.target as Node)) return;

      onClosePopOver(false);
    }

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClosePopOver, triggerRef]);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      exit={{ opacity: 0, y: 7 }}
      className="absolute right-12 top-full z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white pl-4 pt-4 shadow-lg sm:w-[420px]"
    >
      <div className="pl-1">
        <CustomText
          textSize="lg"
          textVariant="primary"
          className="font-medium"
        >
          Notifications
        </CustomText>
        <LineDivider heightClass="my-1" />
      </div>

      <div className="max-h-[320px] overflow-y-auto pr-2">
        {visibleNotifications.map((item, index) => (
          <div key={item.id}>
            <div
              className={cn(
                "flex flex-col rounded-lg p-2 hover:bg-neutral-100 ",
                index === visibleNotifications.length - 1 ? "mb-8" : "",
              )}
            >
              <CustomText textVariant="primary">{item.title}</CustomText>
              <CustomText textSize="xsm" textVariant="secondary">
                {item.body}
              </CustomText>
              <p className="text-[12px] text-neutral-400 mt-0.5 text-right font-extralight">
                {formatRelativeTime(item.createdAt)}
              </p>
            </div>
            {index !== visibleNotifications.length - 1 && (
              <LineDivider heightClass="my-0" />
            )}
          </div>
        ))}
      </div>

      {notifications.length > initialCount && (
        <button
          type="button"
          onClick={() =>
            setCount((prev) =>
              prev >= notifications.length
                ? initialCount
                : notifications.length,
            )
          }
          className="py-4 text-sm font-medium text-primary-500 hover:underline"
        >
          {isExpanded ? "Show less" : "View all notifications"}
        </button>
      )}
    </motion.div>
  );
}
