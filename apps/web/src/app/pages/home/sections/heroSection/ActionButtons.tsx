import { Button } from "@/components/ui/Button";
import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import TravelerIcon from "@/assets/travelerIcon.svg?react";
import ArrowIcon from "@/assets/arrow.svg?react";
import ParcelIcon from "@/assets/parcelIcon.svg?react";
import CustomText from "@/components/ui/CustomText";
import { Link } from "react-router-dom";

export default function ActionButtons() {
  const size = "xl";
  const titleSize = "md";
  const subtitleSize = "xsm";
  return (
    <section className="flex gap-10 mt-16">
      <Link to={"/parcels"}>
        <Button
          subtitle={
            <CustomText as="span" textSize={subtitleSize}>
              See items that need to be sent.
            </CustomText>
          }
          variant={"secondary"}
          size={size}
          leadingIcon={
            <CircleBadge
              size={size}
              bgColor="parcel"
              children={
                <SvgIcon size="xl" Icon={ParcelIcon} color={"primary"} />
              }
            />
          }
          trailingIcon={<SvgIcon size="sm" Icon={ArrowIcon} />}
        >
          <CustomText as="span" textSize={titleSize} textVariant="primary">
            Browse Parcels
          </CustomText>
        </Button>
      </Link>

      <Link to={"/travelers"}>
        <Button
          subtitle={
            <CustomText as="span" textSize={subtitleSize}>
              See who is traveling soon.
            </CustomText>
          }
          variant={"trip"}
          size={"xl"}
          leadingIcon={
            <CircleBadge
              size={size}
              bgColor="trip"
              children={
                <SvgIcon size="xl" Icon={TravelerIcon} color={"trip"} />
              }
            />
          }
          trailingIcon={<SvgIcon size="sm" Icon={ArrowIcon} />}
        >
          <CustomText as="span" textSize={titleSize} textVariant="primary">
            Browse Trips
          </CustomText>
        </Button>
      </Link>
    </section>
  );
}
