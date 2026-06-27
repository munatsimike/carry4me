import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  FieldErrors,
  FieldNamesMarkedBoolean,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { ChevronDown } from "lucide-react";
import FloatingInputField from "@/app/components/CustomInputField";
import { useLocations } from "@/app/hookes/useLocation";
import { toDialCode, toflag } from "@/app/Mapper";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { PhoneWithCountryFields } from "../../validation/phoneWithCountrySchema";

/** Shared by sign-in, complete profile, phone entry, and profile phone change. */
const COUNTRY_CODE_MENU_CLASSNAME =
  "fixed z-[120] max-h-[min(50vh,12rem)] overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 bg-white shadow-lg";

type PhoneNumberWithCountryFieldsProps = {
  register: UseFormRegister<PhoneWithCountryFields>;
  setValue: UseFormSetValue<PhoneWithCountryFields>;
  watch: UseFormWatch<PhoneWithCountryFields>;
  errors: FieldErrors<PhoneWithCountryFields>;
  dirtyFields: FieldNamesMarkedBoolean<PhoneWithCountryFields>;
  touchedFields: FieldNamesMarkedBoolean<PhoneWithCountryFields>;
  disabled?: boolean;
  defaultCountryCode?: string | null;
  phoneHelperText?: string;
  className?: string;
};

export default function PhoneNumberWithCountryFields({
  register,
  setValue,
  watch,
  errors,
  dirtyFields,
  touchedFields,
  disabled = false,
  defaultCountryCode,
  phoneHelperText,
  className,
}: PhoneNumberWithCountryFieldsProps) {
  const { countryOptions } = useLocations();
  const selectedCountry = watch("countryCode");
  const phoneNumber = watch("phoneNumber");
  const selectedDialCode = selectedCountry ? toDialCode(selectedCountry) : null;
  const selectedFlagIcon = selectedCountry ? toflag(selectedCountry) : null;

  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [countryMenuPosition, setCountryMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const countryMenuListRef = useRef<HTMLDivElement | null>(null);

  const updateCountryMenuPosition = useCallback(() => {
    if (!countryMenuRef.current) return;
    const rect = countryMenuRef.current.getBoundingClientRect();
    setCountryMenuPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (selectedCountry || !countryOptions[0]) return;

    const initial = defaultCountryCode ?? countryOptions[0];
    setValue("countryCode", initial, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [countryOptions, defaultCountryCode, selectedCountry, setValue]);

  useEffect(() => {
    if (!countryMenuOpen) {
      setCountryMenuPosition(null);
      return;
    }

    updateCountryMenuPosition();
    window.addEventListener("resize", updateCountryMenuPosition);

    return () => window.removeEventListener("resize", updateCountryMenuPosition);
  }, [countryMenuOpen, updateCountryMenuPosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        countryMenuRef.current?.contains(target) ||
        countryMenuListRef.current?.contains(target)
      ) {
        return;
      }
      setCountryMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countryMenuPortal =
    countryMenuOpen &&
    countryMenuPosition &&
    createPortal(
      <div
        ref={countryMenuListRef}
        role="listbox"
        aria-label="Country codes"
        className={COUNTRY_CODE_MENU_CLASSNAME}
        style={{
          top: countryMenuPosition.top,
          left: countryMenuPosition.left,
          width: countryMenuPosition.width,
        }}
      >
        {countryOptions.map((option) => {
          const flagIcon = toflag(option);
          return (
            <button
              key={option}
              type="button"
              role="option"
              onClick={() => {
                setValue("countryCode", option, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                setCountryMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              {flagIcon && <SvgIcon size="xs" Icon={flagIcon} />}
              <span className="truncate">
                {option} {toDialCode(option) ?? ""}
              </span>
            </button>
          );
        })}
      </div>,
      document.body,
    );

  return (
    <>
      {countryMenuPortal}
      <div
        className={className ?? "grid grid-cols-[minmax(132px,140px)_minmax(0,1fr)] gap-3"}
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <CustomText as="label" textVariant="label" textSize="xs">
            Country code
          </CustomText>
          <input type="hidden" {...register("countryCode")} />
          <div ref={countryMenuRef} className="relative">
            <button
              type="button"
              disabled={disabled}
              aria-expanded={countryMenuOpen}
              aria-label="Select country code"
              onClick={() => {
                setCountryMenuOpen((open) => {
                  const next = !open;
                  if (next) {
                    requestAnimationFrame(updateCountryMenuPosition);
                  }
                  return next;
                });
              }}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-300 bg-white py-2 pl-3 pr-3 text-left text-sm text-ink-primary outline-none transition-colors focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
            >
              <span className="flex min-w-0 items-center gap-2">
                {selectedFlagIcon && <SvgIcon size="xs" Icon={selectedFlagIcon} />}
                <span className="truncate">
                  {selectedCountry
                    ? `${selectedCountry} ${selectedDialCode ?? ""}`
                    : "Select"}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
            </button>
          </div>
          {errors.countryCode?.message && (
            <CustomText textVariant="error" textSize="xs">
              {errors.countryCode.message}
            </CustomText>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <CustomText as="label" textVariant="label" textSize="xs">
            Phone number
          </CustomText>
          <FloatingInputField
            hasValue={!!phoneNumber}
            placeholder="Phone number"
            inputMode="numeric"
            pattern="[0-9]*"
            helperText={phoneHelperText}
            disabled={disabled}
            error={errors.phoneNumber?.message}
            isDirty={!!dirtyFields.phoneNumber}
            isTouched={!!touchedFields.phoneNumber}
            {...register("phoneNumber")}
          />
        </div>
      </div>
    </>
  );
}
