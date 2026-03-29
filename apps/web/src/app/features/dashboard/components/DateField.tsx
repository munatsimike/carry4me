import * as React from "react";
import { DayPicker, type Matcher } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parseISO, isValid } from "date-fns";
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

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
};

export function DateField<T extends FieldValues>({
  control,
  name,
  label = "Departure date",
  placeholder = "dd/mm/yyyy",
  disabled,
  error,
  className,
}: DateFieldProps<T>) {
  const [open, setOpen] = React.useState(false);

  const disabledMatchers: Matcher[] = [];
  // Disable dates after today
  disabledMatchers.push({ before: new Date() });

  return (
  <div className={`flex flex-col gap-2 ${className}`}>
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

        return (
          <ErrorText error={error}>
            <div className="relative inline-block">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={[
                  "w-[180px] h-10 px-3 rounded-lg border border-slate-300 text-left flex items-center justify-between gap-2",
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

              {open && !disabled && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                  />

                  <div className="absolute -left-8 md:left-0 bottom-full md:bottom-auto md:top-full z-50  w-[300px] rounded-xl border border-neutral-200 bg-white shadow-lg p-2">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        field.onChange(d ? d.toISOString() : "");
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
                        nav_icon: "text-neutral-700",
                        table: "w-full border-collapse",
                        head_row: "flex",
                        head_cell:
                          "w-7 text-[11px] text-neutral-500 text-center",
                        row: "flex w-full",
                        cell: "w-6 h-6 text-center",
                        day: "p-1",
                        day_button:
                          "w-8 h-8 rounded-full text-xs text-neutral-600 flex items-center justify-center hover:bg-neutral-200",
                        day_selected:
                          "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
                        day_today: "ring-1 ring-neutral-700 rounded-md",
                        day_outside: "text-neutral-900",
                        day_disabled: "text-neutral-700 opacity-50",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </ErrorText>
        );
      }}
    />
  </div>
);

         
}
