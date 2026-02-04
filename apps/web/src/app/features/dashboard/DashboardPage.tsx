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

export default function DashboardPage() {
  //Create get goods use case
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const getGoodsUseCase = useMemo(
    () => new GetGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  // fetch goods category
  const [goodsCategory, setCategory] = useState<GoodsCategory[]>([]);

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

  const [showParcelModal, setParcelModalState] = useState<boolean>(false);
  const [showTripModal, setTripModalState] = useState<boolean>(false);
  const navigate = useNavigate();
  const { userLoggedIn, authChecked } = useAuthState();

  // get logged in user session data
  //const { user, loading } = useAuth();
  useEffect(() => {
    if (!authChecked) return;

    if (!userLoggedIn) {
      navigate("/signin", { replace: true });
    }
  }, [userLoggedIn, authChecked, navigate]);

  if (!authChecked) return null;

  return (
    <DefaultContainer>
      <PageSection align="left">
        <CustomText as="span" textVariant="primary" textSize="xl">
          {<Greeting user="Michael!" />}
        </CustomText>
      </PageSection>
      <ActionButtonRow
        setTripModalState={setTripModalState}
        setParcelModalState={setParcelModalState}
      />
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
            showModal={showParcelModal}
            setModalState={setParcelModalState}
          />
        )}
      </AnimatePresence>
    </DefaultContainer>
  );
}

function StatsSection() {
  return <div></div>;
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
    <div className="flex flex-wrap justify-center items-center gap-6">
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
      <Link to={"/parcels"}>
        <ActionButton
          btnText="Browse trips"
          btnVariant="outline"
          iconColor="primary"
          icon={META_ICONS.travelerIcon}
          showArrow={true}
          textVariant="primary"
        />
      </Link>

      <Link to={"/travelers"}>
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
