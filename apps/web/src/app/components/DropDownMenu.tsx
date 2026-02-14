import type { UseFormRegisterReturn } from "react-hook-form";

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
  const textVariant = `text-ink-primary ${textSize}`;

  return (
    <select
      defaultValue=""
      disabled={disabled}
      className={`px-3 py-2 bg-white border border-neutral-100 ${className} ${
        isPlaceholder ? `text-ink-secondary ${textSize}` : textVariant
      }`}
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
