import { useEffect, useMemo, useRef, useState } from "react";
import { cn, inputError, inputNeutral, inputSuccess } from "../lib/cn";
import { Check, ChevronDown } from "lucide-react";

type ComboBoxProps = {
  placeholder: string;
  menuItems: string[];
  disabled?: boolean;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  isDirty: boolean;
  isTouched?: boolean;
  error?: string;
  heightClass?: string;
  textSize?: string;
  searchable?: boolean;
  roundedClass?: string;
};

export default function ComboBox({
  menuItems,
  placeholder,
  disabled = false,
  className,
  roundedClass = "rounded-xl",
  value = "",
  onValueChange,
  isDirty,
  heightClass = "py-2",
  textSize = "text-sm",
  isTouched,
  error,
  searchable = false,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
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
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const baseClasses = cn(
    `${heightClass} w-full min-w-0 bg-white pl-3 pr-10 text-sm`,
    "text-ellipsis whitespace-nowrap border outline-none",
    className,
    textVariant,
    error ? inputError : showSuccess ? inputSuccess : inputNeutral,
  );

  if (!searchable) {
    return (
      <div className="relative max-w-xs w-full min-w-0">
        <select
          disabled={disabled}
          value={value}
          onClick={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(e) => {
            onValueChange?.(e.target.value);
            setIsOpen(false);
          }}
          className={cn(baseClasses, roundedClass, "appearance-none")}
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

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative max-w-xs w-full min-w-0">
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
        className={cn(baseClasses, roundedClass)}
      />

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

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelected = value === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onValueChange?.(item);
                    setQuery(item);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="truncate">{item}</span>
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
    </div>
  );
}
