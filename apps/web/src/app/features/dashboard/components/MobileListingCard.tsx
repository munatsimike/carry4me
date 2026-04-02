import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import type { ListingTableProps } from "./ListingTable";
import { motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import CardLabel from "@/app/components/card/CardLabel";
import { MoveRight } from "lucide-react";
import { Card } from "@/app/components/card/Card";
import LineDivider from "@/app/components/LineDivider";
import CategoryRow from "@/app/components/CategoryRow";

export function MobileListingCard<T extends Listing>({
  data,
  onEdit,
  onDelete,
  setListingPreview,
  setModalState,
}: ListingTableProps<T>) {
  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {data.map((row) => {
          const formattedStatus =
            row.status.charAt(0).toUpperCase() +
            row.status.slice(1).toLowerCase();
          const goodsCategories = row.goodsCategory.map(
            (x: GoodsCategory) => x.name,
          );
          const isTrip = row.type === "trip";

          return (
            <Card sizeClass="max-w-sm" className="flex flex-col">
              {/* Header */}
              <div className="flex  flex-col">
                <div className="flex items-center w-full justify-between mb-2">
                  <CardLabel
                    variant={isTrip ? "trip" : "parcel"}
                    label={isTrip ? "Trip" : "Parcel"}
                  />

                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-1 text-[12px] font-medium",
                      row.status.toLowerCase() === "active"
                        ? "border-success-200 bg-success-50 text-success-600"
                        : row.status.toLowerCase() === "pending"
                          ? "border-amber-200 bg-amber-50 text-amber-600"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600",
                    ].join(" ")}
                  >
                    {formattedStatus}
                  </span>
                </div>

                <div className="flex mb-3 gap-2 items-center">
                  <CustomText
                    textVariant="primary"
                    textSize="md"
                    className="font-medium leading-6 text-ink-primary break-words"
                  >
                    {row.route.originCity}
                  </CustomText>

                  <MoveRight
                    className="text-neutral-600 h-4 w-4"
                    strokeWidth={1.5}
                  />
                  <CustomText
                    textVariant="primary"
                    textSize="md"
                    className="font-medium leading-6 text-ink-primary break-words"
                  >
                    {row.route.destinationCity}
                  </CustomText>
                </div>

                {isTrip && (
                  <span className="flex gap-2 mb-2">
                    <CustomText textVariant="label" textSize="sm">
                      Date
                    </CustomText>
                    <CustomText
                      textVariant="primary"
                      textSize="sm"
                      className="leading-6 text-ink-primary break-words"
                    >
                      {row.departDate.slice(0, 10)}
                    </CustomText>
                  </span>
                )}
                <span className="mb-3">
                  <CategoryRow
                    tag={isTrip ? "traveler" : "sender"}
                    category={goodsCategories}
                  />
                </span>
              </div>
              <LineDivider heightClass="my-0" />
              {/* Quick summary */}
              <div className="grid grid-cols-2 gap-2 justify-items-start">
                <SummaryPill label="Space" value={`${row.weightKg} kg`} />
                <SummaryPill label="Price/kg" value={`${row.pricePerKg}`} />
              </div>

              {/* Footer actions */}
              <LineDivider heightClass="my-0" />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setListingPreview(row as T)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Preview
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setModalState(true);
                    onEdit({
                      id: row.id,
                      originCountry: row.route.originCountry,
                      originCity: row.route.originCity,
                      destinationCountry: "Zimbabwe",
                      destinationCity: "Harare",
                      goodsCategoryIds: row.goodsCategory.map(
                        (x: GoodsCategory) => x.id,
                      ),
                      itemDescriptions: row.items,
                      weight: row.weightKg,
                      pricePerKg: row.pricePerKg,
                      agreeToRules: false,
                      senderId: row.user.id ?? "",
                      departureDate: isTrip ? row.departDate : "",
                    });
                  }}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-neutral-100"
                >
                  Edit
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => onDelete(row.id)}
                  className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </motion.button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl py-1 text-center">
      <CustomText
        textVariant="label"
        textSize="sm"
        className="text-neutral-500 whitespace-nowrap"
      >
        {label}
      </CustomText>
      <CustomText textVariant="primary" textSize="sm" className="mt-1 ">
        {value}
      </CustomText>
    </div>
  );
}
