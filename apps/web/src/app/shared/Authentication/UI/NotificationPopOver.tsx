import LineDivider from "@/app/components/LineDivider";
import { CloseBackBtn } from "@/app/components/CloseBtn";
import type { CarryRequestNotification } from "@/app/features/carry request/carry request events/domain/CarryRequestNotification";
import { formatRelativeTime } from "@/app/features/dashboard/application/formatRelativeTime";
import { cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type PopoverProps = {
  notifications: CarryRequestNotification[];
  onClosePopOver: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const INITIAL_COUNT = 5;

function NotificationRow({
  item,
  onClosePopOver,
}: {
  item: CarryRequestNotification;
  onClosePopOver: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || isExpanded) return;

    setIsTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [item.body, isExpanded]);

  const showToggle = isExpanded || isTruncated;

  return (
    <div
      className={cn(
        "min-w-0 w-full rounded-lg p-3 transition-colors hover:bg-neutral-50",
        item.readAt === null && "bg-primary-50/50",
      )}
    >
      <Link
        to={item.link}
        onClick={() => onClosePopOver(false)}
        className="block min-w-0"
      >
        <span className="flex items-start justify-between gap-2">
          <CustomText
            textVariant="primary"
            className="line-clamp-2 font-medium"
          >
            {item.title}
          </CustomText>
          {item.readAt === null ? (
            <span
              aria-hidden
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500"
            />
          ) : null}
        </span>
        <p
          ref={bodyRef}
          className={cn(
            "mt-0.5 text-xs leading-relaxed text-ink-secondary",
            !isExpanded && "line-clamp-2",
          )}
        >
          {item.body}
        </p>
      </Link>

      {showToggle ? (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}

      <p className="mt-1 text-[11px] text-neutral-400">
        {formatRelativeTime(item.createdAt)}
      </p>
    </div>
  );
}

export default function NotificationPopover({
  notifications,
  onClosePopOver,
  triggerRef,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(INITIAL_COUNT);

  const visibleNotifications = notifications.slice(0, count);
  const isExpanded = count >= notifications.length;
  const hasNotifications = notifications.length > 0;

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
      role="dialog"
      aria-label="Notifications"
      initial={{ opacity: 0, y: -7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      exit={{ opacity: 0, y: 7 }}
      className="fixed left-3 right-3 top-16 z-30 flex max-h-[min(70vh,520px)] w-auto max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(420px,calc(100vw-2rem))]"
    >
      <div className="relative border-b border-neutral-100 px-4 py-3">
        <CloseBackBtn onClose={onClosePopOver} />
        <div className="pr-8">
          <CustomText
            textSize="lg"
            textVariant="primary"
            className="font-medium"
          >
            Notifications
          </CustomText>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2">
        {!hasNotifications ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Bell className="h-5 w-5 text-neutral-400" strokeWidth={1.75} />
            </span>
            <CustomText textVariant="primary" className="font-medium">
              No notifications yet
            </CustomText>
            <CustomText as="p" textSize="xs" textVariant="secondary">
              Updates about your carry requests will appear here.
            </CustomText>
          </div>
        ) : (
          visibleNotifications.map((item, index) => (
            <div key={item.id}>
              <NotificationRow item={item} onClosePopOver={onClosePopOver} />
              {index !== visibleNotifications.length - 1 ? (
                <LineDivider heightClass="my-0" />
              ) : null}
            </div>
          ))
        )}
      </div>

      {notifications.length > INITIAL_COUNT ? (
        <div className="border-t border-neutral-100 px-4 py-2">
          <button
            type="button"
            onClick={() =>
              setCount((prev) =>
                prev >= notifications.length ? INITIAL_COUNT : notifications.length,
              )
            }
            className="w-full rounded-lg py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            {isExpanded ? "Show less" : `View all (${notifications.length})`}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
