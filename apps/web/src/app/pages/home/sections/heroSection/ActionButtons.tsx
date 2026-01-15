import { Button } from "@/components/ui/Button";
import { CicleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import TravelerIcon from "@/assets/travelerIcon.svg?react";
import ArrowIcon from "@/assets/arrow.svg?react";
import ParcelIcon from "@/assets/parcelIcon.svg?react";
import CustomText from "@/components/ui/CustomText";

export default function ActionButtons() {
  const size = "xl";
  return (
    <section className="flex gap-10 mt-16">
      <Button
        className="w-[335px]"
        subtitle="See items that need to be sent."
        variant={"secondary"}
        size={size}
        leadingIcon={
          <CicleBadge
            size={size}
            bgColor="parcel"
            children={<SvgIcon size="xl" Icon={ParcelIcon} color={"primary"} />}
          />
        }
        trailingIcon={<SvgIcon size="sm" Icon={ArrowIcon} />}
      >
        <CustomText as="span" textSize="sm">Browse Parcels</CustomText>
      </Button>

      <Button
        className="w-[310px]"
        subtitle="See who is traveling soon."
        variant={"trip"}
        size={"xl"}
        leadingIcon={
          <CicleBadge
            size={size}
            bgColor="trip"
            children={<SvgIcon size="xl" Icon={TravelerIcon} color={"trip"} />}
          />
        }
        trailingIcon={<SvgIcon size="sm" Icon={ArrowIcon} />}
      >
        <CustomText as="span" textSize="sm">Browse Trips</CustomText>
      </Button>
    </section>
  );
}
