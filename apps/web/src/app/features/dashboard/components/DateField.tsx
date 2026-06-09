import * as React from "react";
import { createPortal } from "react-dom";
import { DayPicker, type Matcher } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { addMonths, format, parseISO, isValid, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import ErrorText from "@/app/components/text/ErrorText";
import { inputError, inputNeutral, inputSuccess } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";

const CALENDAR_WIDTH = 300;
const CALENDAR_GAP = 8;

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  /** Disable dates more than this many months in the future (inclusive). */
  maxFutureMonths?: number;
};

export function DateField<T extends FieldValues>({
  control,
  name,
  label = "Departure date",
  placeholder = "dd/mm/yyyy",
  disabled,
  error,
  className,
  maxFutureMonths,
}: DateFieldProps<T>) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>(
    {},
  );

  const disabledMatchers: Matcher[] = [];
  disabledMatchers.push({ before: startOfDay(new Date()) });
  if (maxFutureMonths != null && maxFutureMonths > 0) {
    disabledMatchers.push({
      after: startOfDay(addMonths(new Date(), maxFutureMonths)),
    });
  }

  const updatePopoverPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(CALENDAR_WIDTH, window.innerWidth - 16);
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8,
    );
    const top = Math.max(8, rect.top - CALENDAR_GAP);

    setPopoverStyle({
      position: "fixed",
      left,
      top,
      width,
      transform: "translateY(-100%)",
      zIndex: 200,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open, updatePopoverPosition]);

  return (
    <div className={`flex w-full min-w-0 flex-col gap-2 ${className ?? ""}`}>
      {label && (
        <CustomText textSize="sm" textVariant="label">
          {label}
        </CustomText>
      )}

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => {
          const showSuccess =
            (fieldState.isDirty || fieldState.isTouched) && !fieldState.error;
          const raw = field.value as string | undefined;
          const parsed = raw ? parseISO(raw) : null;
          const selectedDate = parsed && isValid(parsed) ? parsed : undefined;

          const calendarPopover =
            open && !disabled ? (
              <>
                <div
                  className="fixed inset-0 z-[190]"
                  onClick={() => setOpen(false)}
                />
                {createPortal(
                  <div
                    style={popoverStyle}
                    className="rounded-xl border border-neutral-200 bg-white p-2 shadow-lg"
                  >
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        // Persist as local calendar date (YYYY-MM-DD) to avoid
                        // timezone shifts that can move the day backward.
                        field.onChange(d ? format(d, "yyyy-MM-dd") : "");
                        if (d) setOpen(false);
                      }}
                      disabled={disabledMatchers}
                      captionLayout="dropdown"
                      modifiersClassNames={{
                        selected:
                          "bg-primary-200 rounded-full text-neutral-900 hover:bg-neutral-300",
                      }}
                      style={
                        {
                          "--rdp-accent-color": "#5689f8",
                          "--rdp-accent-background-color": "#E5E7EB",
                        } as React.CSSProperties
                      }
                      classNames={{
                        caption_label: "hidden",
                        months: "flex flex-col",
                        month: "space-y-4",
                        dropdowns: "flex items-center gap-2 order-1",
                        dropdown:
                          "rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-700",
                        chevron: "text-neutral-700",
                        button_previous: "text-neutral-700",
                        button_next: "text-neutral-700",
                        month_grid: "w-full border-collapse",
                        weekdays: "flex",
                        weekday:
                          "w-7 text-[11px] text-neutral-500 text-center",
                        week: "flex w-full",
                        day: "p-1",
                        day_button:
                          "w-8 h-8 rounded-full text-xs text-neutral-600 flex items-center justify-center hover:bg-neutral-200",
                        selected:
                          "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
                        today: "ring-1 ring-neutral-700 rounded-md",
                        outside: "text-neutral-900",
                        disabled: "text-neutral-700 opacity-50",
                      }}
                    />
                  </div>,
                  document.body,
                )}
              </>
            ) : null;

          return (
            <ErrorText error={error}>
              <div className="relative w-full sm:w-auto">
                <button
                  ref={triggerRef}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    setOpen((v) => {
                      const next = !v;
                      if (next) {
                        requestAnimationFrame(updatePopoverPosition);
                      }
                      return next;
                    });
                  }}
                  className={[
                    "h-10 w-full min-w-0 rounded-xl border border-slate-300 px-3 text-left sm:w-[180px] flex items-center justify-between gap-2",
                    "focus:outline-none focus:border-primary-500",
                    error
                      ? inputError
                      : showSuccess
                        ? inputSuccess
                        : inputNeutral,
                    disabled
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:border-neutral-400",
                  ].join(" ")}
                >
                  <span
                    className={
                      selectedDate
                        ? "text-ink-primary text-sm"
                        : "text-neutral-400 text-sm"
                    }
                  >
                    {selectedDate
                      ? format(selectedDate, "d MMM yyyy")
                      : placeholder}
                  </span>

                  <CalendarIcon className="h-4 w-4 text-neutral-400" />
                </button>
                {calendarPopover}
              </div>
            </ErrorText>
          );
        }}
      />
    </div>
  );
}
