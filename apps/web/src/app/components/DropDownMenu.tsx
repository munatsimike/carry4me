type DropDownMenuProps = {
  placeholder: string;
  menuItems: string[];
  name?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function DropDownMenu({
  menuItems,
  placeholder,
  value,
  onChange,
  disabled = false,
}: DropDownMenuProps) {
  return (
    <select
      className={`px-3 py-2 rounded-xl bg-white border border:primary-500 text-sm ${value === "" ? "text-ink-secondary" : "text-ink-primary"}`}
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
