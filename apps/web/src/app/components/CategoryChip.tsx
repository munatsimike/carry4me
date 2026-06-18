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
        "inline-flex shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-[2px]",
        className,
      )}
    >
      <CustomText
        as="span"
        textVariant="tonal"
        textSize="xs"
        className="leading-tight font-light"
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
