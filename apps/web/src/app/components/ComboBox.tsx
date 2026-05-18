import { useEffect, useMemo, useRef, useState } from "react";
import { cn, inputError, inputNeutral, inputSuccess } from "../lib/cn";
import { Check, ChevronDown } from "lucide-react";
import SvgIcon from "@/components/ui/SvgIcon";
import { toflag } from "../Mapper";

type ComboBoxProps = {
  placeholder: string;
  menuItems: string[];
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  isDirty: boolean;
  isTouched?: boolean;
  error?: string;
  heightClass?: string;
  textSize?: string;
  searchable?: boolean;
  roundedClass?: string;
  disabledMessage?: string;
};

export default function ComboBox({
  menuItems,
  placeholder,
  disabled = false,
  className,
  wrapperClassName,
  roundedClass = "rounded-xl",
  value = "",
  onValueChange,
  isDirty,
  heightClass = "py-2",
  textSize = "text-sm",
  isTouched,
  error,
  searchable = false,
  disabledMessage,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [showDisabledMessage, setShowDisabledMessage] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const isPlaceholder = !value;
  const textVariant = `${isPlaceholder ? "text-neutral-400" : "text-ink-primary"} ${textSize}`;
  const showSuccess = (isDirty || isTouched) && !error;

  const filteredItems = useMemo(() => {
    if (!searchable || !query.trim()) return menuItems;
    return menuItems.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
  }, [menuItems, query, searchable]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setShowDisabledMessage(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showDisabledMessage) return;

    const timer = window.setTimeout(() => {
      setShowDisabledMessage(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [showDisabledMessage]);

  const handleDisabledInteraction = () => {
    if (!disabled || !disabledMessage) return;
    setIsOpen(false);
    setShowDisabledMessage(true);
  };

  const disabledFeedback = showDisabledMessage && disabledMessage && (
    <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
      {disabledMessage}
    </div>
  );

  const disabledOverlay = disabled && disabledMessage && (
    <button
      type="button"
      aria-label={disabledMessage}
      onClick={handleDisabledInteraction}
      className="absolute inset-0 z-10 cursor-not-allowed bg-transparent"
    />
  );

  const selectedFlagIcon =
    value && (!searchable || !isOpen) ? toflag(value) : null;
  const baseClasses = cn(
    `${heightClass} w-full min-w-0 bg-white pl-3 pr-10 text-sm`,
    "text-ellipsis whitespace-nowrap border outline-none",
    className,
    textVariant,
    error ? inputError : showSuccess ? inputSuccess : inputNeutral,
    disabled && "cursor-not-allowed bg-neutral-50 text-neutral-400",
  );

  if (!searchable) {
    return (
      <div
        ref={wrapperRef}
        className={cn("relative w-full min-w-0", wrapperClassName)}
        onMouseDown={handleDisabledInteraction}
      >
        <select
          disabled={disabled}
          value={value}
          onClick={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(e) => {
            onValueChange?.(e.target.value);
            setIsOpen(false);
          }}
          className={cn(
            baseClasses,
            roundedClass,
            "appearance-none",
            selectedFlagIcon && "pl-10",
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {menuItems.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {selectedFlagIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <SvgIcon size="xs" Icon={selectedFlagIcon} />
          </div>
        )}

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
        {disabledOverlay}
        {disabledFeedback}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full min-w-0", wrapperClassName)}
      onMouseDown={handleDisabledInteraction}
    >
      <input
        type="text"
        disabled={disabled}
        value={isOpen ? query : value}
        placeholder={placeholder}
        onFocus={() => {
          setIsOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        className={cn(baseClasses, roundedClass, selectedFlagIcon && "pl-10")}
      />

      {selectedFlagIcon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SvgIcon size="xs" Icon={selectedFlagIcon} />
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {disabledOverlay}

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full min-w-0 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelected = value === item;
              const flagIcon = item ? toflag(item) : null;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onValueChange?.(item);
                    setQuery(item);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex truncate items-center">
                    {flagIcon && <SvgIcon size={"xs"} Icon={flagIcon} />}
                    <span className="ml-3 min-w-0 truncate">{item}</span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-slate-500" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">
              No results found
            </div>
          )}
        </div>
      )}
      {disabledFeedback}
    </div>
  );
}


