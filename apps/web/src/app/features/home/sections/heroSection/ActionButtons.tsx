import { Button } from "@/components/ui/Button";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import ArrowIcon from "@/assets/arrow.svg?react";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  browseMarketplaceArrowClass,
  browseMarketplaceIconClass,
  browseMarketplaceSubtitleClass,
  browseMarketplaceSurfaceClass,
  browseMarketplaceTitleClass,
} from "@/app/shared/marketplace/browseMarketplaceStyles";

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
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-6 sm:gap-5 sm:py-8 md:flex-row md:justify-center md:gap-6 md:py-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="w-full">
        <Link to="/parcels" className="block w-full">
          <Button
            className={cn(
              "group w-full min-w-0 px-4",
              browseMarketplaceSurfaceClass.parcels,
            )}
            subtitle={
              <CustomText
                as="span"
                textSize={subtitleSize}
                className={cn(
                  "text-center leading-snug",
                  browseMarketplaceSubtitleClass,
                )}
              >
                Find a parcel to carry on your trip.
              </CustomText>
            }
            variant="ghost"
            size={size}
            leadingIcon={
              <SvgIcon
                size="xl"
                Icon={META_ICONS.parcelBox}
                className={cn(
                  browseMarketplaceIconClass.parcels,
                  "transition-colors duration-200 group-hover:text-slate-800",
                )}
              />
            }
            trailingIcon={
              <SvgIcon
                size="sm"
                Icon={ArrowIcon}
                className={cn(
                  browseMarketplaceArrowClass.parcels,
                  "transition-colors duration-200 group-hover:text-slate-800",
                )}
              />
            }
          >
            <CustomText
              as="span"
              textSize={titleSize}
              textVariant="primary"
              className={cn("leading-snug", browseMarketplaceTitleClass.parcels)}
            >
              Browse parcels
            </CustomText>
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full">
        <Link to="/travelers" className="block w-full">
          <Button
            className={cn(
              "group w-full min-w-0 px-4",
              browseMarketplaceSurfaceClass.trips,
            )}
            subtitle={
              <CustomText
                as="span"
                textSize={subtitleSize}
                className={cn(
                  "text-center leading-snug",
                  browseMarketplaceSubtitleClass,
                )}
              >
                Find a traveler to carry your parcel.
              </CustomText>
            }
            variant="ghost"
            size={size}
            leadingIcon={
              <SvgIcon
                size="xl"
                Icon={META_ICONS.planeFilled}
                className={cn(
                  browseMarketplaceIconClass.trips,
                  "transition-colors duration-200 group-hover:text-primary-700",
                )}
              />
            }
            trailingIcon={
              <SvgIcon
                size="sm"
                Icon={ArrowIcon}
                className={cn(
                  browseMarketplaceArrowClass.trips,
                  "transition-colors duration-200 group-hover:text-primary-700",
                )}
              />
            }
          >
            <CustomText
              as="span"
              textSize={titleSize}
              textVariant="primary"
              className={cn("leading-snug", browseMarketplaceTitleClass.trips)}
            >
              Browse trips
            </CustomText>
          </Button>
        </Link>
      </motion.div>
    </motion.section>
  );
}
