import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";

type CategoryChipProps = {
  children: string;
  className?: string;
};

export function CategoryChip({ children, className }: CategoryChipProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border border-[#334155]/15 bg-[#334155]/10 px-2 py-[2px]",
        className,
      )}
    >
      <CustomText
        as="span"
        textSize="xs"
        className="leading-tight font-light text-[#475569]"
      >
        {children}
      </CustomText>
    </span>
  );
}

export function CategoryChipList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((name) => (
        <li key={name}>
          <CategoryChip>{name}</CategoryChip>
        </li>
      ))}
    </ul>
  );
}
