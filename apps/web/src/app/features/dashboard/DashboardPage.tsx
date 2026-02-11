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
import { AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/card/Card";
import type { ActivityItem } from "./domain/ActivityItem";
import { toColorMapper } from "./application/toColorMapper";
import { SupabaseAuthRepository } from "@/app/shared/data/LoginRepository";
import { GetUsersNameUseCase } from "@/app/shared/Authentication/application/GetUsersNameUseCase";

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

  const [fullName, setFullName] = useState<string | null>(null);
  const [showParcelModal, setParcelModalState] = useState<boolean>(false);
  const [showTripModal, setTripModalState] = useState<boolean>(false);
  const navigate = useNavigate();
  const { userLoggedIn, authChecked, userId } = useAuthState();
  // fetch goods category
  const [goodsCategory, setCategory] = useState<GoodsCategory[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchName = async () => {
      const name = await getFullNameUseCase.execute(userId);
      if (name) setFullName(name);
    };

    fetchName();
  }, [userId]);

  const { data, error, isLoading } = useAsync(() => getGoodsUseCase.execute());
  if (error) {
    if (isNetworkError(error)) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!isLoading && data) {
      setCategory(data);
    }
  }, [isLoading, data]);

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

      <div className="flex flex-col gap-14">
        <ActionButtonRow
          setTripModalState={setTripModalState}
          setParcelModalState={setParcelModalState}
        />

        <div className="flex flex-wrap gap-10">
          <StatsSection
            statsList={[
              { title: "Posted Trips", stat: 1 },
              { title: "Posted  Parcel", stat: 1 },
              { title: "Deliveries completed", stat: 1 },
              { title: "Matches", stat: 1 },
            ]}
          />
          <YourActivitySection
            tripActivityList={[
              { title: "Pending matches", status: "Pending", count: 2 },
              { title: "Awaiting handover", status: "Pending", count: 2 },
              {
                title: "Delivery InProgress",
                status: "InProgress",
                count: 2,
              },
              { title: "Delivered", status: "Completed", count: 2 },
            ]}
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

type StatItem = {
  title: string;
  stat: number;
};
type StatsProps = {
  statsList: StatItem[];
};

type ActivityProps = {
  tripActivityList: ActivityItem[];
};

function YourActivitySection({ tripActivityList }: ActivityProps) {
  return (
    <div className="flex flex-col gap-4">
      <CustomText textVariant="primary" textSize="xl">
        {"Your Activity"}
      </CustomText>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <span className="flex flex-col gap-4 sm:pr-14">
            <span className="inline-flex gap-3 items-center">
              <CircleBadge size="md" bgColor="primary">
                <SvgIcon
                  color="primary"
                  size={"md"}
                  Icon={META_ICONS.parcelBox}
                ></SvgIcon>
              </CircleBadge>
              <CustomText textVariant="primary" textSize="md">
                {"My Parcels"}
              </CustomText>
            </span>
            <ActivityItems activityList={tripActivityList} />
          </span>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <span className="inline-flex gap-3">
              <CircleBadge size="md" bgColor="primary">
                <SvgIcon
                  color="primary"
                  size={"md"}
                  Icon={META_ICONS.travelerIcon}
                ></SvgIcon>
              </CircleBadge>
              <CustomText textVariant="primary" textSize="md">
                {"My Trips"}
              </CustomText>
            </span>
            <ActivityItems activityList={tripActivityList} />
          </div>
        </Card>
      </div>
      <RecentActivities />
      <></>
    </div>
  );
}

function RecentActivities() {
  return (
    <div className="flex flex-col border border:neutral-100 rounded-xl p-4">
      <CustomText textVariant="primary" textSize="lg">
        {"Recent activities"}
      </CustomText>
    </div>
  );
}

function ActivityItems({ activityList }: { activityList: ActivityItem[] }) {
  return (
    <span className="flex flex-col gap-3">
      {activityList.map((item) => (
        <span key={item.title} className="inline-flex gap-3 items-center">
          <span
            className={`w-3 h-3 rounded-full pointer-cursor ${toColorMapper[item.status]}`}
          />
          <CustomText textVariant="secondary" textSize="xsm">
            {item.title} {`(${item.count})`}
          </CustomText>
        </span>
      ))}
    </span>
  );
}
function StatsSection({ statsList }: StatsProps) {
  return (
    <div className="flex flex-col gap-3">
      <CustomText textVariant="primary" textSize="xl">
        {"Your Stats"}
      </CustomText>
      <div className="w-fit">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-end">
          {statsList.map((item) => (
            <Card className="flex flex-col items-center gap-3">
              <CustomText>{item.title}</CustomText>
              <CustomText>{item.stat}</CustomText>
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
  return (
    <div className="flex flex-wrap justify-center items-center gap-4">
      <ActionButton
        onClick={setTripModalState}
        btnText="Post a trip"
        iconColor="onDark"
        icon={META_ICONS.travelerIcon}
      />
      <ActionButton
        onClick={setParcelModalState}
        btnText="Post a parcel"
        btnVariant="secondary"
        textVariant="primary"
      />
      <Link to={"/travelers"}>
        <ActionButton
          btnText="Browse trips"
          btnVariant="outline"
          iconColor="primary"
          icon={META_ICONS.travelerIcon}
          showArrow={true}
          textVariant="primary"
        />
      </Link>

      <Link to={"/parcels"}>
        <ActionButton
          showArrow={true}
          btnText="Browse parcels"
          btnVariant="outline"
          textVariant="primary"
        />
      </Link>
    </div>
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
