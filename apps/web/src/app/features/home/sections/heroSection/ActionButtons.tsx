import { Button } from "@/components/ui/Button";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import ArrowIcon from "@/assets/arrow.svg?react";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
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
      className="mx-auto flex w-full max-w-3xl flex-col gap-3 py-6 sm:gap-4 sm:py-8 md:flex-row md:justify-center md:py-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="w-full">
        <Link to="/parcels" className="block w-full">
          <Button
            className={cn(
              "w-full min-w-0 border border-[#334155]/20 bg-[#334155]/10 px-4 shadow-sm",
              "hover:border-[#334155]/30 hover:bg-[#334155]/15 hover:shadow-md",
            )}
            subtitle={
              <CustomText
                as="span"
                textSize={subtitleSize}
                className="text-center leading-snug text-[#475569]"
              >
                See what people need sent home.
              </CustomText>
            }
            variant="ghost"
            size={size}
            leadingIcon={
              <SvgIcon
                size="xl"
                Icon={META_ICONS.parcelBox}
                className="text-[#475569]"
              />
            }
            trailingIcon={
              <SvgIcon size="sm" Icon={ArrowIcon} className="text-[#64748b]" />
            }
          >
            <CustomText
              as="span"
              textSize={titleSize}
              textVariant="primary"
              className="leading-snug text-[#334155]"
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
              "w-full min-w-0 border border-primary-200 bg-primary-50 px-4 shadow-sm",
              "hover:border-primary-300 hover:bg-primary-100 hover:shadow-md",
            )}
            subtitle={
              <CustomText
                as="span"
                textSize={subtitleSize}
                className="text-center leading-snug text-[#475569]"
              >
                See who is traveling home soon.
              </CustomText>
            }
            variant="ghost"
            size={size}
            leadingIcon={
              <SvgIcon
                size="xl"
                Icon={META_ICONS.planeFilled}
                className="text-primary-600"
              />
            }
            trailingIcon={
              <SvgIcon size="sm" Icon={ArrowIcon} className="text-primary-500" />
            }
          >
            <CustomText
              as="span"
              textSize={titleSize}
              textVariant="primary"
              className="leading-snug text-primary-800"
            >
              Browse trips
            </CustomText>
          </Button>
        </Link>
      </motion.div>
    </motion.section>
  );
}
