import { Button } from "@/components/ui/Button";
import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon from "@/components/ui/SvgIcon";
import TravelerIcon from "@/assets/travelerIcon.svg?react";
import ArrowIcon from "@/assets/arrow.svg?react";
import ParcelIcon from "@/assets/parcelIcon.svg?react";
import CustomText from "@/components/ui/CustomText";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ActionButtons() {
  const size = "xl";
  const titleSize = "lg";
  const subtitleSize = "xs";

  return (
    <motion.section
      className="flex w-full flex-col md:flex-row md:justify-center gap-5 sm:gap-7 py-6 sm:p-20 md:max-w-4xl"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Browse Parcels */}
      <motion.div variants={itemVariants} className="w-full">
        <Link to={"/parcels"} className="w-full">
          <Button
            className="w-full"
            subtitle={
              <CustomText
                textVariant="onDark"
                className="whitespace-nowrap"
                as="span"
                textSize={subtitleSize}
              >
                See what people need sent home.
              </CustomText>
            }
            variant="primary"
            size={size}
            leadingIcon={
              <CircleBadge size={size} bgColor="transparent">
                <SvgIcon size="xxl" Icon={ParcelIcon} color="onDark" />
              </CircleBadge>
            }
            trailingIcon={<SvgIcon size="sm" Icon={ArrowIcon} color="grey" />}
          >
            <CustomText
              as="span"
              textSize={titleSize}
              textVariant="onDark"
              className="whitespace-nowrap"
            >
              Browse Parcels
            </CustomText>
          </Button>
        </Link>
      </motion.div>

      {/* Browse Trips */}
      <motion.div variants={itemVariants} className="w-full">
        <Link to={"/travelers"} className="w-full">
          <Button
            className="w-full"
            subtitle={
              <CustomText
                className="whitespace-nowrap"
                textVariant="secondary"
                as="span"
                textSize={subtitleSize}
              >
                See who is traveling home soon.
              </CustomText>
            }
            variant="secondary"
            size={size}
            leadingIcon={
              <CircleBadge size={size} bgColor="transparent">
                <SvgIcon size="xxl" Icon={TravelerIcon} color="primary" />
              </CircleBadge>
            }
            trailingIcon={
              <SvgIcon size="sm" Icon={ArrowIcon} color="neutral" />
            }
          >
            <CustomText
              as="span"
              textSize={titleSize}
              textVariant="primary"
              className="whitespace-nowrap"
            >
              Browse Trips
            </CustomText>
          </Button>
        </Link>
      </motion.div>
    </motion.section>
  );
}
