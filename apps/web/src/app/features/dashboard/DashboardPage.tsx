import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/supabase/AuthProvider";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";
import PageSection from "../../components/PageSection";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import type { SvgIconComponent } from "@/types/Ui";
import { motion } from "framer-motion";
import { Card } from "@/app/components/card/Card";
import StatsSection from "./components/StatsSection";
import SuggestedMatchesTabs, {
  type SuggestedMatchesData,
  type SuggestedMatchTabId,
} from "./components/SuggestedMatchesTabs";
import { EMPTY_DASHBOARD_SUGGESTED_MATCHES } from "./application/suggestedMatches";
import { toColorMapper } from "./application/toColorMapper";
import type { StatsItem } from "./domain/stats.types";
import type { DashboardData } from "./domain/DashboardData";
import { Clock, ClipboardList } from "lucide-react";
import type { CarryRequestNotification } from "../carry request/carry request events/domain/CarryRequestNotification";
import {
  useDashboard,
  useDashboardSuggestedMatches,
} from "@/app/hooks/queries/useDashboardQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import LineDivider from "@/app/components/LineDivider";
import { formatRelativeTime } from "./application/formatRelativeTime";
import { cn } from "@/app/lib/cn";
import { iconForActivity } from "./application/iconForActivity";
import Greeting from "@/app/components/Greeting";

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
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();

  const { data, error } = useDashboard(user?.id);
  const {
    data: suggestedMatches,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useDashboardSuggestedMatches(user?.id);

  useEffect(() => {
    if (location.hash !== "#suggested-matches") return;

    const scrollToSuggested = () => {
      document
        .getElementById("suggested-matches")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const frame = requestAnimationFrame(scrollToSuggested);
    return () => cancelAnimationFrame(frame);
  }, [location.hash, suggestionsLoading, location.key]);

  useQueryErrorEffect(error, !!user?.id);

  const fullName = profile?.fullName ?? null;
  const dashboardData: DashboardData | null = data?.dashboard ?? null;
  const notifications: CarryRequestNotification[] =
    data?.recentNotifications ?? [];

  const requirePhoneVerification = (action: "trip" | "parcel") => {
    if (!user?.id) return;

    guardAction(() => {
      if (action === "trip") {
        navigate("/create-trip?mode=create&returnTo=/dashboard");
      }

      if (action === "parcel") {
        navigate("/create-parcel?mode=create&returnTo=/dashboard");
      }
    });
  };

  const tabFromSearch = new URLSearchParams(location.search).get("tab");
  const suggestedMatchTabFromUrl: SuggestedMatchTabId | undefined =
    tabFromSearch === "trips" || tabFromSearch === "parcels"
      ? tabFromSearch
      : undefined;
  const suggestedMatchTab =
    (
      location.state as { suggestedMatchTab?: SuggestedMatchTabId } | null
    )?.suggestedMatchTab ?? suggestedMatchTabFromUrl;

  return (
    <>
      {/* Main dashboard section */}
      <section className="py-2 sm:py-3">
        <div className="mx-auto w-full max-w-container px-4 sm:px-5 lg:px-6">
          <PageSection align="left">
            <Greeting user={fullName} />
          </PageSection>

          <div className="flex flex-col gap-6 pt-2 sm:pt-4">
            <ActionButtonRow
              onPostTrip={() => requirePhoneVerification("trip")}
              onPostParcel={() => requirePhoneVerification("parcel")}
            />

            <div className="flex flex-col gap-6 sm:justify-center md:flex-row md:items-start">
              <StatsSection
                statsList={dashboardData ? dashboardData.stats : []}
              />

              <YourActivitySection
                recentActivityList={notifications}
                activityList={dashboardData ? dashboardData.activity : []}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Full-width suggested matches */}
      <section
        id="suggested-matches"
        className="w-full bg-canvas pt-3 pb-5 scroll-mt-4 flex-1"
      >
        <div className="mx-auto w-full max-w-container px-4 sm:px-5 lg:px-6">
          <DashboardSuggestedMatchesSection
            data={suggestedMatches}
            isLoading={suggestionsLoading}
            error={suggestionsError}
            initialTab={suggestedMatchTab}
          />
        </div>
      </section>
    </>
  );
}

type ActivityProps = {
  activityList: StatsItem[];
  recentActivityList: CarryRequestNotification[];
};

function DashboardSuggestedMatchesSection({
  data,
  isLoading,
  error,
  initialTab,
}: {
  data?: SuggestedMatchesData;
  isLoading: boolean;
  error: unknown;
  initialTab?: SuggestedMatchTabId;
}) {
  if (isLoading) {
    return (
      <section className="w-full min-w-0 flex-col gap-2">
        <CustomText textVariant="primary" textSize="lg" className="font-medium">
          Suggested matches
        </CustomText>
        <p className="text-sm text-neutral-500">Loading suggested matches...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full min-w-0 flex-col gap-2">
        <CustomText textVariant="primary" textSize="lg" className="font-medium">
          Suggested matches
        </CustomText>
        <p className="text-sm text-neutral-500">
          Suggested matches are unavailable right now.
        </p>
      </section>
    );
  }

  const matchData: SuggestedMatchesData = data ?? EMPTY_DASHBOARD_SUGGESTED_MATCHES;

  return <SuggestedMatchesTabs data={matchData} initialTab={initialTab} />;
}

function YourActivitySection({
  activityList,
  recentActivityList,
}: ActivityProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <CustomText textVariant="primary" textSize="lg" className="font-medium">
        {"Your activities"}
      </CustomText>
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
        <RequestProgress
       activityList={activityList} />
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
      <Card enableHover={false} paddingClass="p-3" className="h-full flex-1" borderClass="">
        <div className="flex flex-col px-2 pt-1 mx-auto">
          <span className="flex flex-col gap-3">
            <span className="inline-flex gap-3 items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Clock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <CustomText textVariant="primary" textSize="md">
                {"Recent activity"}
              </CustomText>
            </span>
            <LineDivider heightClass="my-1" />
          </span>

          {recentActivities.length > 0 &&
            recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex w-full min-w-0 flex-col">
                <div className="flex gap-3 hover:bg-neutral-100 p-2 rounded-lg">
                  <span className="inline-flex pt-1">
                    {iconForActivity(activity.type)}
                  </span>

                  <div
                    key={activity.id}
                    className="flex w-full min-w-0 flex-col"
                  >
                    <div className="flex flex-col items-stretch justify-between md:flex-row md:items-center">
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
            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-neutral-400">
              <p className="text-sm font-medium text-ink-secondary sm:mt-6">
                No activity yet
              </p>

              <p className="max-w-sm text-xs">
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
function RequestProgress({ activityList }: { activityList: StatsItem[] }) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative w-full max-w-full overflow-hidden rounded-3xl bg-slate-200/80 pt-1 lg:max-w-sm"
    >
      <Card enableHover={false} className="h-full flex-1 border-0">
        <div className="flex flex-col gap-4 bg-white px-4 pb-4 pt-0 sm:px-3 sm:pb-5 sm:pt-0">
          <span className="inline-flex min-w-0 items-center gap-3 border-b border-neutral-100 pb-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <CustomText
              textVariant="primary"
              textSize="md"
              className="truncate font-medium"
            >
              Request progress
            </CustomText>
          </span>

          <RequestProgressItem activityList={activityList} />
        </div>
      </Card>
    </motion.div>
  );
}

function RequestProgressItem({ activityList }: { activityList: StatsItem[] }) {
  return (
    <span className="flex flex-col gap-2.5">
      {activityList.map((item) => {
        const isInteractive = (item.count ?? 0) > 0 && !!item.link;

        return (
          <span
            key={item.itemName}
            className={[
              "inline-flex min-w-0 items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 transition-all",
              isInteractive
                ? "hover:bg-neutral-100 hover:-translate-y-0.5"
                : "hover:bg-neutral-100",
            ].join(" ")}
          >
          <span className="inline-flex min-w-0 items-center gap-2.5">
            <span
              className={`h-2 w-2 rounded-full ${item.status && toColorMapper[item.status]}`}
            />
            <Link to={`${isInteractive ? item.link : ""}`}>
              <CustomText
                textVariant={`${isInteractive ? "secondary" : "helperText"}`}
                className={`${isInteractive ? "cursor-pointer" : "cursor-text"}`}
              >
                {item.itemName}
              </CustomText>
            </Link>
          </span>
          <CustomText
            textVariant={`${isInteractive ? "secondary" : "helperText"}`}
            textSize="xs"
            className="rounded-full bg-white px-2 py-0.5"
          >
            {item.count}
          </CustomText>
          </span>
        );
      })}
    </span>
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
      className="mx-auto grid grid-cols-1 items-stretch gap-4 px-5 sm:grid-cols-2 md:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <ActionButton
          onClick={onPostTrip}
          btnText="Post a trip"
          btnVariant="ghost"
          icon={META_ICONS.planeFilled}
          iconSize="lg"
          textVariant="onDark"
          buttonClassName="border border-primary-600 bg-primary-500 shadow-sm hover:border-primary-700 hover:bg-primary-600 hover:shadow-md"
          iconClassName="text-white"
          textClassName="text-white"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ActionButton
          onClick={onPostParcel}
          btnText="Post a parcel"
          btnVariant="ghost"
          icon={META_ICONS.parcelBox}
          iconSize="lg"
          textVariant="onDark"
          buttonClassName="border border-orange-600 bg-orange-500 shadow-sm hover:border-orange-700 hover:bg-orange-600 hover:shadow-md"
          iconClassName="text-white"
          textClassName="text-white"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link to="/travelers" className="block w-full">
          <ActionButton
            btnText="Browse trips"
            btnVariant="ghost"
            icon={META_ICONS.planeIcon}
            iconColor="primary"
            iconSize="lg"
            textVariant="primary"
            showArrow
            buttonClassName="border border-primary-200 bg-primary-50 shadow-sm hover:border-primary-300 hover:bg-primary-100 hover:shadow-md"
            iconClassName="text-primary-600"
            textClassName="text-primary-800"
          />
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Link to="/parcels" className="block w-full">
          <ActionButton
            btnText="Browse parcels"
            btnVariant="ghost"
            icon={META_ICONS.parcelBoxOutlined}
            iconColor="dark"
            iconSize="lg"
            textVariant="primary"
            showArrow
            buttonClassName="border border-orange-200 bg-orange-50 shadow-sm hover:border-orange-300 hover:bg-orange-100 hover:shadow-md"
            iconClassName="text-orange-600"
            textClassName="text-orange-900"
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
  iconSize?: "lg" | "xl";
  icon?: SvgIconComponent;
  buttonClassName?: string;
  iconClassName?: string;
  textClassName?: string;
  onClick?: () => void;
};

function ActionButton({
  showArrow = false,
  btnVariant = "primary",
  textVariant = "onDark",
  iconColor = "primary",
  iconSize = "xl",
  btnText,
  icon = META_ICONS.parcelBox,
  buttonClassName,
  iconClassName,
  textClassName,
  onClick,
}: ActionButtonsProps) {
  return (
    <Button
      onClick={onClick ? () => onClick() : () => {}}
      variant={btnVariant}
      size={"xxl"}
      className={cn("w-full", buttonClassName)}
      trailingIcon={
        showArrow && (
          <SvgIcon
            size={"sm"}
            Icon={META_ICONS.arrowSmall}
            color="primary"
            className={iconClassName}
          />
        )
      }
    >
      <span className="flex flex-col items-center gap-1.5">
        <SvgIcon
          color={iconColor}
          size={iconSize}
          Icon={icon}
          className={iconClassName}
        />
        <CustomText
          as="span"
          textVariant={textVariant}
          textSize="lg"
          className={cn("whitespace-nowrap pr-3", textClassName)}
        >
          {btnText}
        </CustomText>
      </span>
    </Button>
  );
}
