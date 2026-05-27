import { cn } from "@/app/lib/cn";
import type { ReactNode } from "react";

export { ModalSeparator } from "@/app/components/LineDivider";

/** Content block above the modal action separator (pb-4 matches footer pt-4). */
export function ModalBody({  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 pb-4", className)}>{children}</div>
  );
}

/** Action row below a single top border; spacing matches ModalBody. */
export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
