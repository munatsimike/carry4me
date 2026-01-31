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
    <section className="flex flex-wrap gap-10 m-24 ">
      <Link to={"/parcels"}>
        <Button
          subtitle={
            <CustomText textVariant="onDark" as="span" textSize={subtitleSize}>
              See what people need sent home.
            </CustomText>
          }
          variant={"primary"}
          size={size}
          leadingIcon={
            <CircleBadge
              size={size}
              bgColor="transparent"
              children={
                <SvgIcon size="xl" Icon={ParcelIcon} color={"onDark"} />
              }
            />
          }
          trailingIcon={<SvgIcon size="sm" Icon={ArrowIcon} />}
        >
          <CustomText as="span" textSize={titleSize} textVariant="onDark">
            Browse Parcels
          </CustomText>
        </Button>
      </Link>

      <Link to={"/travelers"}>
        <Button
          subtitle={
            <CustomText
              textVariant="secondary"
              as="span"
              textSize={subtitleSize}
            >
              See who is traveling home soon.
            </CustomText>
          }
          variant={"secondary"}
          size={"xl"}
          leadingIcon={
            <CircleBadge
              size={size}
              bgColor="transparent"
              children={
                <SvgIcon size="xl" Icon={TravelerIcon} color={"primary"} />
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
