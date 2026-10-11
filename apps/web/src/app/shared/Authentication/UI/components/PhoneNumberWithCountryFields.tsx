import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { toCountryName, toDialCode, toflag } from "@/app/Mapper";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { PhoneWithCountryFields } from "../../validation/phoneWithCountrySchema";

/** Shared by sign-in, complete profile, phone entry, and profile phone change. */
const COUNTRY_CODE_MENU_GUTTER_PX = 12;
const COUNTRY_CODE_FIELDS_CLASSNAME =
  "grid grid-cols-1 gap-3 sm:grid-cols-[minmax(132px,140px)_minmax(0,1fr)]";
const COUNTRY_CODE_MENU_CLASSNAME =
  "fixed z-[120] w-max max-h-[min(50vh,12rem)] overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 bg-white shadow-lg";

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
    minWidth: number;
    maxWidth: number;
  } | null>(null);
  const fieldsRowRef = useRef<HTMLDivElement | null>(null);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const countryMenuListRef = useRef<HTMLDivElement | null>(null);

  const updateCountryMenuPosition = useCallback(() => {
    if (!countryMenuRef.current) return;
    const trigger = countryMenuRef.current.getBoundingClientRect();
    const row = fieldsRowRef.current?.getBoundingClientRect();
    const maxWidth = Math.max(
      trigger.width,
      window.innerWidth - COUNTRY_CODE_MENU_GUTTER_PX * 2,
    );
    const minWidth = Math.min(
      maxWidth,
      Math.max(trigger.width, row?.width ?? 0),
    );
    const measuredWidth =
      countryMenuListRef.current?.getBoundingClientRect().width ?? minWidth;
    const width = Math.min(maxWidth, Math.max(minWidth, measuredWidth));
    const left = Math.min(
      Math.max(COUNTRY_CODE_MENU_GUTTER_PX, trigger.left),
      Math.max(
        COUNTRY_CODE_MENU_GUTTER_PX,
        window.innerWidth - width - COUNTRY_CODE_MENU_GUTTER_PX,
      ),
    );
    setCountryMenuPosition({
      top: trigger.bottom + 8,
      left,
      minWidth,
      maxWidth,
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

  useLayoutEffect(() => {
    if (!countryMenuOpen) {
      setCountryMenuPosition(null);
      return;
    }

    updateCountryMenuPosition();
    const frame = requestAnimationFrame(updateCountryMenuPosition);
    const viewport = window.visualViewport;
    window.addEventListener("resize", updateCountryMenuPosition);
    window.addEventListener("scroll", updateCountryMenuPosition, true);
    viewport?.addEventListener("resize", updateCountryMenuPosition);
    viewport?.addEventListener("scroll", updateCountryMenuPosition);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateCountryMenuPosition);
      window.removeEventListener("scroll", updateCountryMenuPosition, true);
      viewport?.removeEventListener("resize", updateCountryMenuPosition);
      viewport?.removeEventListener("scroll", updateCountryMenuPosition);
    };
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
          minWidth: countryMenuPosition.minWidth,
          maxWidth: countryMenuPosition.maxWidth,
        }}
      >
        {countryOptions.map((option) => {
          const flagIcon = toflag(option);
          const dialCode = toDialCode(option);
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
              <span className="shrink-0 font-medium">
                {dialCode ?? option}
              </span>
              {dialCode ? (
                <span className="whitespace-nowrap text-slate-500">
                  {toCountryName(option) ?? option}
                </span>
              ) : null}
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
        ref={fieldsRowRef}
        className={className ?? COUNTRY_CODE_FIELDS_CLASSNAME}
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
                <span className="min-w-0 truncate">
                  {selectedDialCode ?? selectedCountry ?? "Select"}
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
