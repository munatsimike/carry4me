import type { GoodsCondition } from "@/types/Ui";
import { GOODS_CONDITIONS } from "@/types/Ui";

export const GOODS_CONDITION_OPTIONS: {
  value: GoodsCondition;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "na", label: "Not applicable" },
];

export function normalizeGoodsCondition(
  condition: string | undefined | null,
): GoodsCondition {
  if (condition === "used") return "used";
  if (condition === "na") return "na";
  return "new";
}

export function formatGoodsConditionLabel(
  condition: GoodsCondition | string | undefined | null,
): string {
  const normalized = normalizeGoodsCondition(condition);
  return (
    GOODS_CONDITION_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? "New"
  );
}

export function isGoodsCondition(value: unknown): value is GoodsCondition {
  return (
    typeof value === "string" &&
    (GOODS_CONDITIONS as readonly string[]).includes(value)
  );
}
