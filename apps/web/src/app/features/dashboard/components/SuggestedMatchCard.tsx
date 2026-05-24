import { Link } from "react-router-dom";
import { format } from "date-fns";
import { MoveRight } from "lucide-react";
import { Card } from "@/app/components/card/Card";
import CardLabel from "@/app/components/card/CardLabel";
import { WeightAndPrice } from "@/app/components/card/WeightAndPrice";
import CategoryRow from "@/app/components/CategoryRow";
import DateRow from "@/app/components/DateRow";
import CustomText from "@/components/ui/CustomText";
import type { ListingSource } from "@/app/shared/Authentication/domain/Listing";
import { dateFormat } from "@/types/Ui";

function listingStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return "border-success-200 bg-success-50 text-success-600";
  }

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-600";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-600";
}

function formatListingStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function SuggestedMatchCard({
  listing,
  ctaLabel,
  href,
}: {
  listing: ListingSource;
  ctaLabel: string;
  href: string;
}) {
  const categories = listing.goodsCategory.map((category) => category.name);
  const isTrip = listing.type === "trip";

  return (
    <Card
      enableHover
      paddingClass="p-4 sm:p-5"
      cornerRadiusClass="rounded-3xl"
      borderClass="border border-slate-200 transition-colors hover:border-primary-200"
      shadowClass="shadow-sm transition-shadow hover:shadow-md"
      className="flex h-full flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <CardLabel
          variant={isTrip ? "trip" : "parcel"}
          label={isTrip ? "Trip" : "Parcel"}
        />
        <span
          className={[
            "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
            listingStatusClass(listing.status),
          ].join(" ")}
        >
          {formatListingStatus(listing.status)}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50/80 p-3 sm:p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CustomText
              textVariant="primary"
              textSize="md"
              className="font-medium leading-6"
            >
              {listing.route.originCity}
            </CustomText>
            <MoveRight
              className="h-4 w-4 shrink-0 text-neutral-600"
              strokeWidth={1.5}
            />
            <CustomText
              textVariant="primary"
              textSize="md"
              className="font-medium leading-6"
            >
              {listing.route.destinationCity}
            </CustomText>
          </div>
          <CustomText textVariant="secondary" textSize="xs">
            {listing.route.originCountry} → {listing.route.destinationCountry}
          </CustomText>
        </div>

        <DateRow
          date={
            isTrip
              ? format(new Date(listing.departDate), dateFormat)
              : "Flexible"
          }
        />

        <CategoryRow
          tag={isTrip ? "traveler" : "sender"}
          category={categories.length > 0 ? categories : ["Any category"]}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-white px-3 py-3 sm:px-4">
        <WeightAndPrice
          weightLabel={isTrip ? "Available space" : "Parcel weight"}
          weight={listing.weightKg}
          priceLabel={isTrip ? "Price per kg" : "Budget per kg"}
          price={listing.pricePerKg}
          country={listing.route.originCountry}
        />
      </div>

      <div className="mt-4 pt-1">
        <Link
          to={href}
          className="flex w-full items-center justify-center rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {ctaLabel}
        </Link>
      </div>
    </Card>
  );
}
