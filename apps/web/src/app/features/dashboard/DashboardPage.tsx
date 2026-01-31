import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "../../shared/supabase/AuthState";
import DefaultContainer from "@/components/ui/DefualtContianer";
import PageSection from "../../components/PageSection";
import { SupabaseTripsRepository } from "../trips/data/SupabaseTripsRepository";
import { CreateTripUseCase } from "../trips/application/CreateTripUsecase";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";
import { CircleBadge, type CirleBgColor } from "@/components/ui/CircleBadge";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import type { SvgIconComponent } from "@/types/Ui";
import CreatParcelModal from "./CreateParcel";
import Greeting from "@/app/components/Greeting";

export default function DashboardPage() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const { userLoggedIn, authChecked } = useAuthState();
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const useCase = useMemo(() => new CreateTripUseCase(repo), [repo]);
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
         {<Greeting user="Michael!"/>}
        </CustomText>
      </PageSection>
      <div className="flex flex-wrap justify-center items-center gap-6">
        <ActionButtons
          onClick={setShowModal}
          btnText="Post a trip"
          iconColor="trip"
          badgeColor="trip"
          icon={META_ICONS.travelerIcon}
        />
        <ActionButtons btnText="Post a parcel" />
        <Link to={"/parcels"}>
          <ActionButtons
            btnText="Browse trips"
            btnVariant="secondary"
            iconColor="trip"
            icon={META_ICONS.travelerIcon}
            badgeColor="trip"
            showArrow={true}
            textVariant="primary"
          />
        </Link>

        <Link to={"/travelers"}>
          <ActionButtons
            showArrow={true}
            btnText="Browse parcels"
            btnVariant="secondary"
            textVariant="primary"
          />
        </Link>
      </div>
      {showModal && (
        <CreatParcelModal showModal={showModal} setShowModal={setShowModal} />
      )}
    </DefaultContainer>
  );

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

  function ActionButtons({
    showArrow = false,
    btnVariant = "primary",
    textVariant = "onDark",
    iconColor = "primary",
    badgeColor = "primary",
    btnText,
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
}
