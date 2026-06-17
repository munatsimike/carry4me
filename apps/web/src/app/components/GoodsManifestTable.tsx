import type { GoodsItem } from "@/types/Ui";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";

export function normalizeGoodsItem(item: Partial<GoodsItem>): GoodsItem {
  return {
    quantity: item.quantity ?? 1,
    description: item.description?.trim() ?? "",
    size: item.size?.trim() ?? "",
    condition: item.condition === "used" ? "used" : "new",
  };
}

export function formatGoodsCondition(
  condition: GoodsItem["condition"],
): string {
  return condition === "used" ? "Used" : "New";
}

type GoodsManifestTableProps = {
  items: Partial<GoodsItem>[];
  compact?: boolean;
  className?: string;
};

export default function GoodsManifestTable({
  items,
  compact = false,
  className,
}: GoodsManifestTableProps) {
  const rows = items.map(normalizeGoodsItem).filter((item) => item.description);

  if (rows.length === 0) {
    return <CustomText textSize="sm">—</CustomText>;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs text-neutral-500">
            <th className="py-2 pr-3 font-medium">Item</th>
            <th className="py-2 pr-3 font-medium whitespace-nowrap">Qty</th>
            <th className="py-2 pr-3 font-medium">Size</th>
            <th className="py-2 font-medium">Condition</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr
              key={`${item.description}-${index}`}
              className="border-b border-neutral-100 last:border-0"
            >
              <td className={cn("py-2 pr-3 text-ink-primary", compact && "max-w-[140px] truncate")}>
                {item.description}
              </td>
              <td className="py-2 pr-3 text-ink-primary">{item.quantity}</td>
              <td className="py-2 pr-3 text-ink-primary">{item.size || "—"}</td>
              <td className="py-2 text-ink-primary">
                {formatGoodsCondition(item.condition)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
