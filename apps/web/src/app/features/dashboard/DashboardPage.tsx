import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/supabase/AuthProvider";
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
import { SupabaseGoodsRepository } from "../goods/data/SupabaseGoodsRepository";
import { GetGoodsUseCase } from "../goods/application/GetGoodsUseCase";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/app/components/card/Card";
import { toColorMapper } from "./application/toColorMapper";
import type { StatsItem } from "./domain/stats.types";
import { GetDashboardDataUseCase } from "./application/GetDashboardData";
import type { DashboardData } from "./domain/DashboardData";
import { SubabaseDashboardRepository } from "./data/SupabaseDashboardRepository";
import { Clock, Truck } from "lucide-react";
import { GetNotificationUseCase } from "../carry request/carry request events/application/CreateNotificationUseCase";
import { SupabaseNotificationRepository } from "../carry request/carry request events/data/SupabaseNotificationRepository";
import type { CarryRequestNotification } from "../carry request/carry request events/domain/CarryRequestNotification";
import LineDivider from "@/app/components/LineDivider";
import { formatRelativeTime } from "./application/formatRelativeTime";
import { iconForActivity } from "./application/iconForActivity";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
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
  //Create get goods use case
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const getGoodsUseCase = useMemo(
    () => new GetGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  const dashboardDataRepository = useMemo(
    () => new SubabaseDashboardRepository(),
    [],
  );

  const getDashboardDataUseCase = useMemo(
    () => new GetDashboardDataUseCase(dashboardDataRepository),
    [dashboardDataRepository],
  );

  const supabaseNotificationRepo = useMemo(
    () => new SupabaseNotificationRepository(),
    [],
  );
  const getNotificationUseCase = useMemo(
    () => new GetNotificationUseCase(supabaseNotificationRepo),
    [supabaseNotificationRepo],
  );
  const [fullName, setFullName] = useState<string | null>(null);
  const [showParcelModal, setParcelModalState] = useState<boolean>(false);
  const [showTripModal, setTripModalState] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [notifications, setNotification] = useState<CarryRequestNotification[]>(
    [],
  );
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { showSupabaseError } = useUniversalModal();
  // fetch goods category
  const [goodsCategory, setCategory] = useState<GoodsCategory[]>([]);

  // redirect is user is not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    if (profile) setFullName(profile.fullName);

    // fetch dashboard data, recent activies deliveries, posted parcels and trips etc
    const fetchDashboardData = async () => {
      const [dashboardData, notifications] = await Promise.all([
        namedCall("dashboard", getDashboardDataUseCase.execute(user.id)),
        namedCall("Notifications", getNotificationUseCase.execute(user.id)),
      ]);

      if (dashboardData.result.success)
        setDashboardData(dashboardData.result.data);

      if (notifications.result.success)
        setNotification(notifications.result.data.slice(0, 4));

      // show fetch dashboard data error
      if (!dashboardData.result.success) {
        showSupabaseError(dashboardData.result.error);
        return;
      }

      // show fetch notification errors
      if (!notifications.result.success) {
        showSupabaseError(notifications.result.error);
        return;
      }
    };

    fetchDashboardData();
  }, [user?.id, profile]);

  // fetch goods categories
  useEffect(() => {
    if (!showTripModal && !showParcelModal) return;
    async function fetchGoods() {
      const { result } = await namedCall("goods", getGoodsUseCase.execute());
      if (!result.success) {
        showSupabaseError(result.error);
        return;
      }
      setCategory(result.data);
    }
    fetchGoods();
  }, [showParcelModal, showTripModal]);

  return (
    <DefaultContainer outerClassName="min-h-screen">
      <PageSection align="left">{<Greeting user={fullName} />}</PageSection>

      <div className="flex flex-col gap-12 pt-2 sm:pt-4">
        <ActionButtonRow
          setTripModalState={setTripModalState}
          setParcelModalState={setParcelModalState}
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
        {showTripModal && (
          <CreateTripModal
            goodsCategory={goodsCategory}
            setModalState={setTripModalState}
          />
        )}

        {/* hide and show post parcel modal */}
        {showParcelModal && (
          <CreatParcelModal
            goodsCategory={goodsCategory}
            setModalState={setParcelModalState}
          />
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
      <div className="flex sm:flex-row flex-col gap-6">
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
      className="relative max-w-sm overflow-hidden rounded-3xl pt-1 bg-emerald-200"
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
                className="flex flex-col w-full md:min-w-[350px]"
              >
                <div className="flex gap-3 hover:bg-neutral-100 p-2 rounded-lg">
                  <span className="inline-flex pt-1">
                    {iconForActivity(activity.type)}
                  </span>

                  <div
                    key={activity.id}
                    className="flex flex-col w-full max-w-sm"
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
      className="relative max-w-sm overflow-hidden rounded-3xl pt-1 bg-slate-200"
    >
      <Card enableHover={false} className="h-full flex-1">
        <div className="flex flex-col gap-4 sm:pr-6 bg-white">
          <span className="inline-flex items-center gap-3">
            <CircleBadge size="md" bgColor="neutral" paddingClassName="1">
              <Truck className="text-neutral-600 h-5 w-5" strokeWidth={1} />
            </CircleBadge>
            <CustomText
              textVariant="primary"
              textSize="md"
              className="whitespace-nowrap"
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
          className="inline-flex gap-3 items-center whitespace-nowrap"
        >
          <span
            className={`w-2 h-2 rounded-full ${item.status && toColorMapper[item.status]}`}
          />
          <Link to={`${item.count > 0 ? item.link : ""}`}>
            <span className="inline-flex gap-2 items-center">
              <CustomText
                textVariant={`${item.count > 0 ? "secondary" : "helperText"}`}
                className={`${item.count > 0 ? "cursor-pointer" : "cursor-text"}`}
              >
                {item.itemName}
              </CustomText>
              <CustomText
                textVariant={`${item.count > 0 ? "secondary" : "helperText"}`}
                textSize="xsm"
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
    <div className="px-2 max-w-sm flex flex-col gap-3">
      <CustomText textVariant="primary" textSize="lg" className="font-medium">
        {"Your Stats"}
      </CustomText>
      <div className="min-h-[85px] min-w-[200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statsList.map((item) => (
            <Link key={item.itemName} to={item.link ?? ""}>
              <Card
                enableHover={false}
                key={item.itemName}
                className="flex flex-col items-center gap-3 hover:bg-neutral-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
              >
                <CustomText className="whitespace-nowrap">
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
  setTripModalState: (v: boolean) => void;
  setParcelModalState: (state: boolean) => void;
};
function ActionButtonRow({
  setParcelModalState,
  setTripModalState,
}: ActionButtonRowProps) {
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
          onClick={setTripModalState}
          btnText="Post a trip"
          iconColor="onDark"
          icon={META_ICONS.travelerIcon}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ActionButton
          onClick={setParcelModalState}
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
  onClick?: (v: boolean) => void;
  showModal?: boolean;
};

function ActionButton({
  showArrow = false,
  btnVariant = "primary",
  textVariant = "onDark",
  iconColor = "primary",
  btnText,
  showModal,
  icon = META_ICONS.parcelBox,
  onClick,
}: ActionButtonsProps) {
  return (
    <Button
      onClick={onClick ? () => onClick(!showModal) : () => {}}
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
