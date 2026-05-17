import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/supabase/AuthProvider";
import { COMPLETE_PROFILE_PATH } from "@/app/shared/Authentication/domain/profileCompletion";
import DefaultContainer from "@/components/ui/DefualtContianer";
import PageSection from "../../components/PageSection";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";
import { CircleBadge } from "@/components/ui/CircleBadge";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import type { SvgIconComponent } from "@/types/Ui";
import CreatParcelModal from "../parcels/ui/CreateParcelModal";
import CreateTripModal from "../trips/ui/CreateTripModal";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/app/components/card/Card";
import { toColorMapper } from "./application/toColorMapper";
import type { StatsItem } from "./domain/stats.types";
import type { DashboardData } from "./domain/DashboardData";
import { Clock, Truck } from "lucide-react";
import type { CarryRequestNotification } from "../carry request/carry request events/domain/CarryRequestNotification";
import { useDashboard } from "@/app/hooks/queries/useDashboardQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import LineDivider from "@/app/components/LineDivider";
import { formatRelativeTime } from "./application/formatRelativeTime";
import { iconForActivity } from "./application/iconForActivity";
import Greeting from "@/app/components/Greeting";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";

/**
 * Dashboard Page
 *
 * Purpose:
 * - Displays user overview (trips, parcels, activity)
 *
 * Data Flow:
 * - Fetches data from Supabase (trips, requests, parcels)
 * - Uses local state to control modal visibility
 *
 * Key Features:
 * - Post trips or parcels
 * - Browse trips and parcels
 * - View statuses of posted trips and parcels
 * - View recent activity (request statuses)
 *
 * Notes:
 * - Acts as the main user hub after authentication
 */

export default function DashboardPage() {
  //Create get goods use case

  const [createParcel, setCreateParcel] = useState<boolean>(false);
  const [createTrip, setCreateTrip] = useState<boolean>(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery();
  const { user, profile, loading, profileIncomplete } = useAuth();

  const { data, error } = useDashboard(user?.id);
  useQueryErrorEffect(error, !!user?.id);

  const fullName = profile?.fullName ?? null;
  const dashboardData: DashboardData | null = data?.dashboard ?? null;
  const notifications: CarryRequestNotification[] =
    data?.recentNotifications ?? [];

  // fetch goods category
  // redirect is user is not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const requirePhoneVerification = (action: "trip" | "parcel") => {
    if (!user?.id) return;

    if (profileIncomplete) {
      navigate(COMPLETE_PROFILE_PATH);
      return;
    }
    if (action === "trip") {
      setCreateTrip(true);
    }

    if (action === "parcel") {
      setCreateParcel(true);
    }
  };

  useEffect(() => {
    if (!createTrip || !isMobile) return;
    navigate("/create-trip?mode=create");
  }, [createTrip, isMobile, navigate]);

  useEffect(() => {
    if (!createParcel || !isMobile) return;
    navigate("/create-parcel?mode=create");
  }, [createParcel, isMobile, navigate]);

  return (
    <DefaultContainer outerClassName="min-h-screen">
      <PageSection align="left">{<Greeting user={fullName} />}</PageSection>

      <div className="flex flex-col gap-12 pt-2 sm:pt-4">
        <ActionButtonRow
          onPostTrip={() => requirePhoneVerification("trip")}
          onPostParcel={() => requirePhoneVerification("parcel")}
        />

        <div className="flex flex-col sm:justify-center md:flex-row gap-6">
          <StatsSection statsList={dashboardData ? dashboardData.stats : []} />
          <YourActivitySection
            recentActivityList={notifications}
            activityList={dashboardData ? dashboardData.activity : []}
          />
        </div>
      </div>

      <AnimatePresence>
        {createTrip && !isMobile && (
          <CreateTripModal setModalState={() => setCreateTrip(false)} />
        )}

        {/* hide and show post parcel modal */}
        {createParcel && !isMobile && (
          <CreatParcelModal setModalState={() => setCreateParcel(false)} />
        )}
      </AnimatePresence>
    </DefaultContainer>
  );
}

type StatsProps = {
  statsList: StatsItem[];
};

type ActivityProps = {
  activityList: StatsItem[];
  recentActivityList: CarryRequestNotification[];
};

function YourActivitySection({
  activityList,
  recentActivityList,
}: ActivityProps) {
  return (
    <div className="flex flex-col gap-3">
      <CustomText textVariant="primary" textSize="lg" className="font-medium">
        {"Your activities"}
      </CustomText>
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
        <DeliverySummary activityList={activityList} />
        <RecentActivity recentActivities={recentActivityList} />
      </div>
    </div>
  );
}

function RecentActivity({
  recentActivities,
}: {
  recentActivities: CarryRequestNotification[];
}) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative w-full max-w-full overflow-hidden rounded-3xl bg-emerald-200 pt-1 lg:max-w-sm"
    >
      <Card enableHover={false} paddingClass="p-3" className="h-full flex-1">
        <div className="flex flex-col px-2 mx-auto">
          <span className="flex flex-col gap-3">
            <span className="inline-flex gap-3 items-center">
              <CircleBadge size="md" bgColor="neutral" paddingClassName="1">
                <Clock className="text-neutral-600 h-5 w-5" strokeWidth={1} />
              </CircleBadge>
              <CustomText textVariant="primary" textSize="md">
                {"Recent activity"}
              </CustomText>
            </span>
            <LineDivider heightClass="my-1" />
          </span>

          {recentActivities.length > 0 &&
            recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex w-full min-w-0 flex-col"
              >
                <div className="flex gap-3 hover:bg-neutral-100 p-2 rounded-lg">
                  <span className="inline-flex pt-1">
                    {iconForActivity(activity.type)}
                  </span>

                  <div
                    key={activity.id}
                    className="flex w-full min-w-0 flex-col"
                  >
                    <div className="flex flex-col md:flex-row justify-between md:items-center items-stretch">
                      <CustomText
                        textVariant="secondary"
                        className="whitespace-nowrap"
                      >
                        {activity.title}
                      </CustomText>
                      <p className="text-[12px] text-neutral-500 whitespace-nowrap">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                {index !== recentActivities.length - 1 && (
                  <LineDivider heightClass="my-1" />
                )}
              </div>
            ))}

          {recentActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-neutral-400 p-2">
              <p className="text-sm font-medium text-ink-secondary sm:mt-6">
                No activity yet
              </p>

              <p className="text-xs max-w-sm">
                Post a parcel or find a traveler to get started.
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// card to disply activity items
function DeliverySummary({ activityList }: { activityList: StatsItem[] }) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative w-full max-w-full overflow-hidden rounded-3xl bg-slate-200 pt-1 lg:max-w-sm"
    >
      <Card enableHover={false} className="h-full flex-1">
        <div className="flex flex-col gap-4 sm:pr-6 bg-white">
          <span className="inline-flex min-w-0 items-center gap-3">
            <CircleBadge size="md" bgColor="neutral" paddingClassName="1">
              <Truck className="text-neutral-600 h-5 w-5" strokeWidth={1} />
            </CircleBadge>
            <CustomText
              textVariant="primary"
              textSize="md"
              className="truncate"
            >
              Delivery Summary
            </CustomText>
          </span>

          <DeliverySummaryItem activityList={activityList} />
        </div>
      </Card>
    </motion.div>
  );
}

function DeliverySummaryItem({ activityList }: { activityList: StatsItem[] }) {
  return (
    <span className="flex flex-col gap-3">
      {activityList.map((item) => (
        <span
          key={item.itemName}
          className="inline-flex min-w-0 items-center gap-3"
        >
          <span
            className={`w-2 h-2 rounded-full ${item.status && toColorMapper[item.status]}`}
          />
          <Link to={`${item.count > 0 ? item.link : ""}`}>
            <span className="inline-flex min-w-0 items-center gap-2">
              <CustomText
                textVariant={`${item.count > 0 ? "secondary" : "helperText"}`}
                className={`${item.count > 0 ? "cursor-pointer" : "cursor-text"}`}
              >
                {item.itemName}
              </CustomText>
              <CustomText
                textVariant={`${item.count > 0 ? "secondary" : "helperText"}`}
                textSize="xs"
              >{`(${item.count})`}</CustomText>
            </span>
          </Link>
        </span>
      ))}
    </span>
  );
}
function StatsSection({ statsList }: StatsProps) {
  return (
    <div className="flex w-full max-w-full flex-col gap-3 px-2 lg:max-w-sm">
      <CustomText textVariant="primary" textSize="lg" className="font-medium">
        {"Your Stats"}
      </CustomText>
      <div className="mx-auto min-h-[85px] w-full">
        <div className="grid grid-cols-2 gap-3">
          {statsList.map((item) => (
            <Link key={item.itemName} to={item.link ?? ""}>
              <Card
                enableHover={false}
                key={item.itemName}
                className="flex min-h-[110px] flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CustomText className="sm:whitespace-nowrap">
                  {item.itemName}
                </CustomText>
                <CustomText
                  textVariant="primary"
                  textSize={"lg"}
                  className="font-medium"
                >
                  {item.count}
                </CustomText>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// row with dashboard action buttons- post parcel, post trip, browse trip and browse parcel
type ActionButtonRowProps = {
  onPostTrip: () => void;
  onPostParcel: () => void;
};
function ActionButtonRow({ onPostParcel, onPostTrip }: ActionButtonRowProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-stretch gap-4 px-5 mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <ActionButton
          onClick={onPostTrip}
          btnText="Post a trip"
          iconColor="onDark"
          icon={META_ICONS.travelerIcon}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ActionButton
          onClick={onPostParcel}
          btnText="Post a parcel"
          btnVariant="secondary"
          textVariant="primary"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link to={"/travelers"}>
          <ActionButton
            btnText="Browse trips"
            btnVariant="outline"
            iconColor="primary"
            icon={META_ICONS.travelerIcon}
            showArrow
            textVariant="primary"
          />
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link to={"/parcels"}>
          <ActionButton
            showArrow
            btnText="Browse parcels"
            btnVariant="outline"
            textVariant="primary"
          />
        </Link>
      </motion.div>
    </motion.div>
  );
}

// resuable button for trip and parcel actions
type ActionButtonsProps = {
  showArrow?: boolean;
  btnVariant?: ButtonVariant;
  textVariant?: TextVariant;
  iconColor?: IconColor;
  btnText: string;
  icon?: SvgIconComponent;
  onClick?: () => void;
};

function ActionButton({
  showArrow = false,
  btnVariant = "primary",
  textVariant = "onDark",
  iconColor = "primary",
  btnText,
  icon = META_ICONS.parcelBox,
  onClick,
}: ActionButtonsProps) {
  return (
    <Button
      onClick={onClick ? () => onClick() : () => {}}
      variant={btnVariant}
      size={"xxl"}
      trailingIcon={
        showArrow && (
          <SvgIcon size={"sm"} Icon={META_ICONS.arrowSmall} color="primary" />
        )
      }
    >
      <span className="flex flex-col gap-1.5 items-center">
        <SvgIcon color={iconColor} size={"xl"} Icon={icon} />
        <CustomText
          as="span"
          textVariant={textVariant}
          textSize="lg"
          className="whitespace-nowrap pr-3"
        >
          {btnText}
        </CustomText>
      </span>
    </Button>
  );
}
