import { InlineRow } from "@/app/components/InlineRow";
import ErrorText from "@/app/components/text/ErrorText";
import CustomText from "@/components/ui/CustomText";
import { isAllGoodsCategory } from "../../goods/domain/goodsCategoryConstants";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import { checkBox, checkBoxSvg, cn } from "@/app/lib/cn";

export default function GoodsCategoryGrid({
  label,
  goods,
  selectedIds,
  onChange,
  error,
  includeAllOption = false,
}: {
  label: string;
  error?: string;
  goods: GoodsCategory[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  /** When true, selecting "All" clears other categories and vice versa. */
  includeAllOption?: boolean;
}) {
  const allCategoryId = includeAllOption
    ? goods.find(isAllGoodsCategory)?.id
    : undefined;
  const allSelected = Boolean(
    allCategoryId && selectedIds.includes(allCategoryId),
  );

  const toggle = (id: string, checked: boolean) => {
    if (allCategoryId && id === allCategoryId) {
      onChange(checked ? [allCategoryId] : []);
      return;
    }

    if (allSelected) {
      return;
    }

    if (allCategoryId && checked) {
      onChange([
        ...selectedIds.filter((selectedId) => selectedId !== allCategoryId),
        id,
      ]);
      return;
    }

    const next = checked
      ? [...selectedIds, id]
      : selectedIds.filter((x) => x !== id);

    onChange(next);
  };

  return (
    <ErrorText error={error}>
      <div className="flex flex-col gap-3">
        <InlineRow>
          <CustomText textSize="sm" textVariant="label">
            {label}
          </CustomText>
        </InlineRow>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {goods.map((item) => {
            const checked = selectedIds.includes(item.id);
            const isAllItem = allCategoryId === item.id;
            const isDisabled = allSelected && !isAllItem;

            return (
              <label
                key={item.id}
                className={cn(
                  "flex items-center gap-2 select-none",
                  isDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer",
                )}
              >
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isDisabled}
                    onChange={(e) => toggle(item.id, e.target.checked)}
                    className={checkBox}
                  />

                  {/* Check icon visible only when checked */}
                  <svg
                    viewBox="0 0 24 24"
                    className={checkBoxSvg}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>

                <CustomText
                  textVariant="primary"
                  textSize="sm"
                  className={isDisabled ? "text-neutral-400" : undefined}
                >
                  {item.name}
                </CustomText>
              </label>
            );
          })}
        </div>
      </div>
    </ErrorText>
  );
}
