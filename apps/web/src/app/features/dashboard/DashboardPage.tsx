import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "../../shared/supabase/AuthState";
import DefaultContainer from "@/components/ui/DefualtContianer";
import PageSection from "../../components/PageSection";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";
import { CircleBadge, type CirleBgColor } from "@/components/ui/CircleBadge";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import type { SvgIconComponent } from "@/types/Ui";
import CreatParcelModal from "./CreateParcelModal";
import Greeting from "@/app/components/Greeting";
import CreateTripModal from "./CreateTripModal";
import { SupabaseGoodsRepository } from "../goods/data/SupabaseGoodsRepository";
import { GetGoodsUseCase } from "../goods/application/GetGoodsUseCase";
import { useAsync } from "@/app/hookes/useAsync";
import { isNetworkError } from "@/app/util/isNetworkError";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/app/components/card/Card";
import { toColorMapper } from "./application/toColorMapper";
import { SupabaseAuthRepository } from "@/app/shared/data/LoginRepository";
import { GetUsersNameUseCase } from "@/app/shared/Authentication/application/GetUsersNameUseCase";
import type { StatsItem } from "./domain/stats.types";
import { GetDashboardDataUseCase } from "./application/GetDashboardData";
import { SupabaseTripsRepository } from "../trips/data/SupabaseTripsRepository";
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

export default function DashboardPage() {
  //Create get goods use case
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const getGoodsUseCase = useMemo(
    () => new GetGoodsUseCase(goodsRepo),
    [goodsRepo],
  );
  const supabaseRepository = useMemo(() => new SupabaseAuthRepository(), []);
  const getFullNameUseCase = useMemo(
    () => new GetUsersNameUseCase(supabaseRepository),
    [supabaseRepository],
  );

  const tripRepository = useMemo(() => new SupabaseTripsRepository(), []);
  const dashboardDataRepository = useMemo(
    () => new SubabaseDashboardRepository(),
    [],
  );

  const getDashboardDataUseCase = useMemo(
    () => new GetDashboardDataUseCase(dashboardDataRepository),
    [tripRepository],
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
  const { userLoggedIn, authChecked, userId } = useAuthState();
  const { showSupabaseError } = useUniversalModal();
  // fetch goods category
  const [goodsCategory, setCategory] = useState<GoodsCategory[]>([]);

  const onLoad = async () => {
    console.log("what are you looking at?");
  };

  // fetch dashboard data
  useEffect(() => {
    if (!userId) return;

    const fetchDashboardData = async () => {
      const [dashboardData, name, notifications] = await Promise.all([
        namedCall("dashboard", getDashboardDataUseCase.execute(userId)),
        namedCall("UserName", getFullNameUseCase.execute(userId)),
        namedCall("Notifications", getNotificationUseCase.execute(userId)),
      ]);

      if (dashboardData.result.success)
        setDashboardData(dashboardData.result.data);
      if (name.result.success) setFullName(name.result.data);
      if (notifications.result.success)
        setNotification(notifications.result.data);

      // show fetch dashboard data error
      if (!dashboardData.result.success) {
        showSupabaseError(
          dashboardData.result.error,
          dashboardData.result.status,
          { onRetry: onLoad },
        );
        return;
      }

      // show fetch user name error
      if (!name.result.success) {
        showSupabaseError(name.result.error, name.result.status, {
          onRetry: onLoad,
        });
        return;
      }

      // show fetch notification errors
      if (!notifications.result.success) {
        showSupabaseError(
          notifications.result.error,
          notifications.result.status,
          {
            onRetry: onLoad,
          },
        );
        return;
      }
    };

    fetchDashboardData();
  }, [userId]);

  useEffect(() => {
    if (!showTripModal && !showParcelModal) return;

    async function fetchGoods() {
      const { result } = await namedCall("goods", getGoodsUseCase.execute());
      if (!result.success) {
        showSupabaseError(result.error, result.status, {
          onRetry: fetchGoods,
        });
        return;
      }
      setCategory(result.data);
    }

    fetchGoods();
  }, [showParcelModal, showTripModal]);

  // get logged in user session data
  //const { user, loading } = useAuth();
  useEffect(() => {
    if (!authChecked) return;

    if (!userLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [userLoggedIn, authChecked, navigate]);

  if (!authChecked) return null;

  return (
    <DefaultContainer>
      <PageSection align="left">
        <CustomText as="span" textVariant="primary" textSize="xxl">
          {<Greeting user={fullName} />}
        </CustomText>
      </PageSection>

      <div className="flex flex-col gap-12">
        <ActionButtonRow
          setTripModalState={setTripModalState}
          setParcelModalState={setParcelModalState}
        />

        <div className="flex flex-wrap gap-6">
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
            showModal={showTripModal}
            setModalState={setTripModalState}
          />
        )}

        {/* hide and show post parcel modal */}
        {showParcelModal && (
          <CreatParcelModal
            goodsCategory={goodsCategory}
            showModal={showParcelModal}
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
      <CustomText textVariant="primary" textSize="lg">
        {"Your activities"}
      </CustomText>
      <div className="flex flex-wrap gap-6">
        <MyDeliveries activityList={activityList} />
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
    <Card paddingClass="p-3">
      <div className="flex flex-col max-w-sm">
        <span className="flex flex-col gap-3">
          <span className="inline-flex gap-3 items-center">
            <CircleBadge size="md" bgColor="neutral">
              <Clock className="text-neutral-600" strokeWidth={1.5} />
            </CircleBadge>
            <CustomText textVariant="primary" textSize="md">
              {"Recent activity"}
            </CustomText>
          </span>
          <LineDivider heightClass="my-1" />
        </span>

        {recentActivities &&
          recentActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex flex-col w-full sm:min-w-[350px] max-w-sm"
            >
              <div className="flex gap-3 hover:bg-neutral-100 p-2 rounded-lg">
                <span className="inline-flex pt-1">
                  {iconForActivity(activity.type)}
                </span>

                <div
                  key={activity.id}
                  className="flex flex-col bg-neutral w-full sm:min-w-[330px] max-w-sm"
                >
                  <div className="flex justify-between">
                    <CustomText textVariant="primary">
                      {activity.title}
                    </CustomText>
                    <p className="text-[12px] text-neutral-500">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                  <CustomText
                    as="span"
                    textVariant="secondary"
                    textSize="xsm"
                    className="leading-[1.2] "
                  >
                    {activity.body}
                  </CustomText>
                </div>
              </div>
              {index !== recentActivities.length - 1 && (
                <LineDivider heightClass="my-1" />
              )}
            </div>
          ))}
      </div>
    </Card>
  );
}

// card to disply activity items
function MyDeliveries({ activityList }: { activityList: StatsItem[] }) {
  return (
    <div className="flex flex-col gap-3 max-w-sm">
      <Card>
        <span className="flex flex-col gap-4 sm:pr-6">
          <span className="inline-flex gap-3 items-center">
            <CircleBadge size="md" bgColor="neutral">
              <Truck className="text-neutral-600" strokeWidth={1.5} />
            </CircleBadge>
            <CustomText textVariant="primary" textSize="md">
              {"My deliveries"}
            </CustomText>
          </span>

          <ActivityItems activityList={activityList} />
        </span>
      </Card>
    </div>
  );
}

function ActivityItems({ activityList }: { activityList: StatsItem[] }) {
  return (
    <span className="flex flex-col gap-3">
      {activityList.map((item) => (
        <span key={item.itemName} className="inline-flex gap-3 items-center">
          <span
            className={`w-2 h-2 rounded-full ${item.status && toColorMapper[item.status]}`}
          />
          <CustomText
            textVariant="secondary"
            textSize="xsm"
            className="cursor-pointer"
          >
            {item.itemName} {`(${item.count})`}
          </CustomText>
        </span>
      ))}
    </span>
  );
}
function StatsSection({ statsList }: StatsProps) {
  return (
    <div className="flex flex-col gap-3">
      <CustomText textVariant="primary" textSize="lg">
        {"Your Stats"}
      </CustomText>
      <div className="w-fit">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statsList.map((item) => (
            <Card
              key={item.itemName}
              className="flex flex-col items-center gap-3"
            >
              <CustomText>{item.itemName}</CustomText>
              <CustomText textSize={"md"}>{item.count}</CustomText>
            </Card>
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
      className="flex flex-wrap justify-center items-center gap-4 transition-all duration-200 ease-out"
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
  badgeColor?: CirleBgColor;
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
  badgeColor = "transparent",
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
      <span className="flex flex-col gap-2 items-center">
        <CircleBadge size="xl" bgColor={badgeColor}>
          <SvgIcon color={iconColor} size={"xl"} Icon={icon} />
        </CircleBadge>
        <CustomText as="span" textVariant={textVariant} textSize="lg">
          {btnText}
        </CustomText>
      </span>
    </Button>
  );
}
