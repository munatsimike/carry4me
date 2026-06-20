import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import type { ListingTableProps } from "./ListingTable";
import { motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import { formatTripAcceptedCategoryLabels } from "../../goods/domain/goodsCategoryConstants";
import CardLabel from "@/app/components/card/CardLabel";
import { MoveRight } from "lucide-react";
import { Card } from "@/app/components/card/Card";
import LineDivider from "@/app/components/LineDivider";
import CategoryRow from "@/app/components/CategoryRow";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import { toOriginCityFormFields } from "@/app/shared/locations/cityOptions";
import {
  formatListingStatus,
  getListingStatusToggleLabel,
  statusBadgeClass,
} from "@/app/shared/listings/listingStatusPresentation";

export function MobileListingCard<T extends Listing>({
  data,
  onEdit,
  onDelete,
  onToggleStatus,
  setListingPreview,
  setModalState,
}: ListingTableProps<T>) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
      {data.map((row) => {
        const formattedStatus = formatListingStatus(row.status);
        const toggleLabel = getListingStatusToggleLabel(row);
        const isTrip = row.type === "trip";
        const goodsCategories = isTrip
          ? formatTripAcceptedCategoryLabels(row.goodsCategory)
          : row.goodsCategory.map((x: GoodsCategory) => x.name);

        return (
          <Card key={row.id} sizeClass="w-full" className="flex min-w-0 flex-col">
            {/* Header */}
            <div className="flex flex-col">
              <div className="flex items-center w-full justify-between mb-2">
                <CardLabel
                  variant={isTrip ? "trip" : "parcel"}
                  label={isTrip ? "Trip" : "Parcel"}
                />

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-medium ${statusBadgeClass(row.status)}`}
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
                    Departure
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
              <SummaryPill
                label="Price per kg"
                value={formatCurrencyByCountry(
                  row.route.originCountry,
                  row.pricePerKg,
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  },
                )}
              />
            </div>

            {/* Footer actions */}
            <LineDivider heightClass="my-0" />
            <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-4">
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
                    ...toOriginCityFormFields(
                      row.route.originCity,
                      row.route.originCityIsCustom,
                    ),
                    destinationCountry: row.route.destinationCountry,
                    destinationCity: row.route.destinationCity,
                    goodsCategoryIds: row.goodsCategory.map(
                      (x: GoodsCategory) => x.id,
                    ),
                    itemDescriptions: row.items,
                    weight: row.weightKg,
                    pricePerKg: row.pricePerKg,
                    confirmNoProhibitedItems: false,
                    understandTravelerInspection: false,
                    senderId: row.user.id ?? "",
                    departureDate: isTrip ? row.departDate : "",
                  });
                }}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-neutral-100"
              >
                Edit
              </motion.button>

              {toggleLabel && onToggleStatus ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() =>
                    onToggleStatus(row, toggleLabel === "Activate")
                  }
                  className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-800 hover:bg-primary-100"
                >
                  {toggleLabel}
                </motion.button>
              ) : null}

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
