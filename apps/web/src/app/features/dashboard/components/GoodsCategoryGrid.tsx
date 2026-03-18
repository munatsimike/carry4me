import { InlineRow } from "@/app/components/InlineRow";
import ErrorText from "@/app/components/text/ErrorText";
import CustomText from "@/components/ui/CustomText";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import { checkBox, checkBoxSvg } from "@/app/lib/cn";

export default function GoodsCategoryGrid({
  label,
  goods,
  selectedIds,
  onChange,
  error,
}: {
  label: string;
  error?: string;
  goods: GoodsCategory[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const toggle = (id: string, checked: boolean) => {
    const next = checked
      ? [...selectedIds, id]
      : selectedIds.filter((x) => x !== id);

    onChange(next);
  };

  return (
    <ErrorText error={error}>
      <div className="flex flex-col gap-3">
        <InlineRow>
          <CustomText textSize="xsm" textVariant="label">
            {label}
          </CustomText>
        </InlineRow>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {goods.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={checked}
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

                <CustomText textVariant="primary" textSize="xsm">
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
