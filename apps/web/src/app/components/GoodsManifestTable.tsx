import type { GoodsItem } from "@/types/Ui";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import {
  formatGoodsConditionLabel,
  normalizeGoodsCondition,
} from "@/app/shared/goodsCondition";

export function normalizeGoodsItem(item: Partial<GoodsItem>): GoodsItem {
  return {
    quantity: item.quantity ?? 1,
    description: item.description?.trim() ?? "",
    size: item.size?.trim() ?? "",
    condition: normalizeGoodsCondition(item.condition),
  };
}

export function formatGoodsCondition(
  condition: GoodsItem["condition"],
): string {
  return formatGoodsConditionLabel(condition);
}

type GoodsManifestTableProps = {
  items: Partial<GoodsItem>[];
  compact?: boolean;
  className?: string;
  variant?: "default" | "review";
  /** Hide the Size column on small screens (e.g. view-items modal on mobile). */
  hideSizeOnMobile?: boolean;
};

function ManifestTable({
  rows,
  compact = false,
  rowBorder = true,
}: {
  rows: GoodsItem[];
  compact?: boolean;
  rowBorder?: boolean;
}) {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table className="w-full min-w-0 border-collapse text-left text-sm">
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
              className={cn(
                rowBorder && "border-b border-neutral-100 last:border-0",
              )}
            >
              <td
                className={cn(
                  "py-2 pr-3 text-ink-primary",
                  compact ? "max-w-[140px] truncate" : "max-w-xs break-words",
                )}
              >
                {item.description}
              </td>
              <td className="py-2 pr-3 text-ink-primary whitespace-nowrap">
                {item.quantity}
              </td>
              <td className="py-2 pr-3 text-ink-primary">{item.size || "—"}</td>
              <td className="py-2 text-ink-primary whitespace-nowrap">
                {formatGoodsCondition(item.condition)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManifestField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
      <CustomText as="p" textSize="xs" textVariant="label" className="mb-0.5">
        {label}
      </CustomText>
      <CustomText as="p" textSize="sm" className="break-words text-ink-primary">
        {value}
      </CustomText>
    </div>
  );
}

export default function GoodsManifestTable({
  items,
  compact = false,
  className,
  variant = "default",
  hideSizeOnMobile = false,
}: GoodsManifestTableProps) {
  const rows = items.map(normalizeGoodsItem).filter((item) => item.description);

  if (rows.length === 0) {
    return <CustomText textSize="sm">—</CustomText>;
  }

  if (variant === "review") {
    return (
      <div className={cn("w-full min-w-0", className)}>
        <ManifestTable rows={rows} compact={compact} rowBorder={false} />
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((item, index) => (
          <div
            key={`${item.description}-${index}-mobile`}
            className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-3"
          >
            {hideSizeOnMobile ? (
              <div className="grid grid-cols-3 gap-3">
                <ManifestField label="Item" value={item.description} />
                <ManifestField label="Qty" value={item.quantity} />
                <ManifestField
                  label="Condition"
                  value={formatGoodsCondition(item.condition)}
                />
              </div>
            ) : (
              <>
                <ManifestField label="Item" value={item.description} />
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <ManifestField label="Qty" value={item.quantity} />
                  <ManifestField label="Size" value={item.size || "—"} />
                  <ManifestField
                    label="Condition"
                    value={formatGoodsCondition(item.condition)}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <ManifestTable rows={rows} compact={compact} />
      </div>
    </div>
  );
}
