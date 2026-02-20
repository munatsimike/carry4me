import type { UseFormRegisterReturn } from "react-hook-form";
import { baseInput, cn } from "../lib/cn";

type DropDownMenuProps = {
  placeholder: string;
  menuItems: string[];
  disabled?: boolean;
  className?: string;
  register?: UseFormRegisterReturn;
  value?: string;
};

export default function DropDownMenu({
  menuItems,
  placeholder,
  disabled = false,
  className = "rounded-full",
  register,
  value = "",
}: DropDownMenuProps) {
  const isPlaceholder = !value;
  const textSize = "text-[14px]";
  const textVariant = `${isPlaceholder ? "text-neutral-400" : "text-ink-primary"} ${textSize}`;

  return (
    <select
      defaultValue=""
      disabled={disabled}
      className={cn(
        `px-3 py-2 bg-white ${className} ${textVariant} ${baseInput}`,
      )}
      {...register}
    >
      <option value="" disabled>
        {placeholder}
      </option>

      {menuItems.map((item) => (
        <option key={item} value={item} className={textVariant}>
          {item}
        </option>
      ))}
    </select>
  );
}
