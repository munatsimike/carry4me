type DropDownMenuProps = {
  placeholder: string;
  menuItems: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  roundedClassName?: string;
};

export default function DropDownMenu({
  menuItems,
  placeholder,
  value,
  onChange,
  roundedClassName = "rounded-full",
  disabled = false,
}: DropDownMenuProps) {
  return (
    <select
      className={`px-3 py-2 ${roundedClassName}  bg-white border text-sm ${value === "" ? "text-ink-secondary" : "text-ink-primary"}`}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled hidden>
        {placeholder}
      </option>
      {menuItems.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
