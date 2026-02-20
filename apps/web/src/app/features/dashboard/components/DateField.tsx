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

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
};

export function DateField<T extends FieldValues>({
  control,
  name,
  label = "Departure date",
  placeholder = "dd/mm/yyyy",
  disabled,
  error,
  className,
  fromDate,
  toDate,
}: DateFieldProps<T>) {
  const [open, setOpen] = React.useState(false);

  const disabledMatchers: Matcher[] = [];

  // Disable dates after today
  disabledMatchers.push({ before: new Date() });

  // Your optional props
  if (fromDate) disabledMatchers.push({ before: fromDate });
  if (toDate) disabledMatchers.push({ after: toDate });

  return (
    <div className={className}>
      {label && <label className="block m-0 p-0 text-sm text-neutral-500 leading-none">{label}</label>}

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const raw = field.value as unknown as string | undefined;
          const parsed = raw ? parseISO(raw) : null;
          const selectedDate = parsed && isValid(parsed) ? parsed : undefined;

          return (
            <div className="mt-3 relative">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={[
                  "w-full sm:w-[150px] h-9 px-3 rounded-md border text-left flex items-center justify-between gap-2",
                  "bg-white border-neutral-300",
                  "focus:outline-none focus:border-primary-500",
                  disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:border-neutral-500",
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

                  <div className="absolute z-50 mt-2 w-[300px] rounded-xl border border-neutral-200 bg-white shadow-lg">
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
                          // overrides the default blue theme
                          "--rdp-accent-color": "#5689f8", // text/icon accent
                          "--rdp-accent-background-color": "#E5E7EB", // selected background
                        } as React.CSSProperties
                      }
                      classNames={{
                        caption_label: "hidden",
                        months: "flex flex-col",
                        month: "space-y-4",

                        // dropdowns first
                        dropdowns: "flex items-center gap-2 order-1",
                        dropdown:
                          "rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-700",

                        // nav right after dropdowns

                        // IMPORTANT: target the icon directly (this is what often stays blue)
                        nav_icon: "text-neutral-700",

                        table: "w-full border-collapse",
                        head_row: "flex gap",
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

              {error ? (
                <ErrorText error={error} />
              ) : null}
            </div>
          );
        }}
      />
    </div>
  );
}
