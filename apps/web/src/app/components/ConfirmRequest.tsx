import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import LineDivider from "./LineDivider";
import CardLabel from "./card/CardLabel";
import { META_ICONS } from "../icons/MetaIcon";
import Stack from "./Stack";
import SendRequestBtn from "./card/SendRequestBtn";
import { Price } from "./card/WeightAndPrice";
import WeightRow from "./WeightRow";
import CategoryRow from "./CategoryRow";
import DateRow from "./DateRow";
import RouteRow from "./RouteRow";
import TravelerRow from "./TravelerRow";
import ButtomSpacer from "./BottomSpacer";
import type { TripListing } from "../features/trips/domain/Trip";
import type { ParcelListing } from "../features/parcels/domain/Parcel";
import IconTextRow from "./card/IconTextRow";
import { useMemo, useState } from "react";
import { SupabaseCarryRequestRepository } from "../features/carry request/data/SupabaseCarryRequestRepository";
import { CreateCarryRequestUseCase } from "../features/carry request/application/CreateCarryReaquest";
import type { GoodsCategory } from "../features/goods/domain/GoodsCategory";
import { useToast } from "./Toast";
import { namedCall } from "../shared/Authentication/application/NamedCall";
import { useUniversalModal } from "../shared/Authentication/application/DialogBoxModalProvider";
import { CircleCheck, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ConfirmRequestProps = {
  loggedInUserId: string;
  trip: TripListing;
  parcel: ParcelListing;
  onClose: () => void;
  isSenderRequesting: boolean;
};

export default function ConfirmRequest({
  loggedInUserId,
  trip,
  parcel,
  onClose,
  isSenderRequesting,
}: ConfirmRequestProps) {
  const carryRequestRepository = useMemo(
    () => new SupabaseCarryRequestRepository(),
    [],
  );
  const createRequest = useMemo(
    () => new CreateCarryRequestUseCase(carryRequestRepository),
    [carryRequestRepository],
  );
  const [requestLoaded, setLoadRequest] = useState<boolean>(false);
  const { showSupabaseError, openInfo } = useUniversalModal();
  const { toast } = useToast();
  const navigate = useNavigate();

  const message = isSenderRequesting
    ? "This traveler does not have enough space for your parcel."
    : "You do not have enough space to carry this parcel.";

  const handleSendRequest = async () => {
    if (requestLoaded) return;
    if (parcel.weightKg > trip.weightKg) {
      toast(message, {
        variant: "warning",
      });
      onClose();
      return;
    }

    const { result } = await namedCall(
      "create carry request",
      createRequest.execute(loggedInUserId, parcel, trip),
    );

    if (!result.success) {
      onClose();
      if (result.status === 409) {
        openInfo({
          icon: <Clock className="h-6 w-6 text-warning-400" />,
          title: "Pending request exists",
          message:
            `You already have a request with this ${isSenderRequesting ? "sender" : "traveler"} that is waiting for a response. Please check the existing request for updates.`,
          label: "Go to requests",
          onClick: () => navigate("/requests"),
        });
      } else {
        showSupabaseError(result.error, result.status);
      }
    }

    if (result.success) {
      openInfo({
        icon: <CircleCheck className="h-6 w-6 text-success-500" />,
        title: "Request sent",
        message:
          "Your request has been sent. You will be notified when the traveler responds.",
        onClick: () => navigate("/requests"),
        label: "View requests",
      });
      setLoadRequest(true);
      onClose();
    }
  };

  return (
    <div className="flex flex-col px-5 py-2">
      <div className="flex justify-center mb-1">
        <SvgIcon color="primary" size={"lg"} Icon={META_ICONS.sendArrow} />
      </div>
      <div className="flex flex-col items-center">
        <CustomText textSize="lg" textVariant="primary">
          {"Send a carry parcel request"}
        </CustomText>
        <CustomText textSize="xsm" textVariant="secondary">
          {isSenderRequesting
            ? "You're requesting this traveler to carry your parcel on their trip."
            : "You're requesting  to carry this parcel on your upcoming trip."}
        </CustomText>
      </div>
      <LineDivider />
      <Trip trip={trip} isSenderRequesting={isSenderRequesting} />
      <LineDivider />
      <Parcel
        parcel={parcel}
        isSenderRequesting={isSenderRequesting}
        travelerPricePerKg={trip.pricePerKg}
      />
      <LineDivider />
      <SendRequestBtn
        buttonTextVariant="onDark"
        payLoad={undefined as never}
        primaryAction={handleSendRequest}
        secondaryAction={onClose}
      />
    </div>
  );
}
function Trip({
  trip,
  isSenderRequesting,
}: {
  trip: TripListing;
  isSenderRequesting: boolean;
}) {
  const label = isSenderRequesting ? "Traveler`s Trip" : "Your Trip";
  const items = trip.goodsCategory.map((item) => item.name);
  return (
    <Stack>
      <span>
        <CardLabel variant={"trip"} label={label} />
        <ButtomSpacer />
      </span>

      {trip.user?.fullName && <TravelerRow name={trip.user.fullName} />}
      <RouteRow
        origin={trip.route.originCountry}
        destination={trip.route.destinationCountry}
      />
      <DateRow date={trip.departDate} />
      <CategoryRow tag={"traveler"} category={items} />
    </Stack>
  );
}

function Parcel({
  parcel,
  isSenderRequesting,
  travelerPricePerKg,
}: {
  parcel: ParcelListing;
  isSenderRequesting: boolean;
  travelerPricePerKg: number;
}) {
  const label = isSenderRequesting ? "Your parcel" : "Sender`s Parcel";
  const items = parcel.goodsCategory.map((item: GoodsCategory) => item.name);
  const pricePerKg = isSenderRequesting
    ? travelerPricePerKg
    : parcel.pricePerKg;

  const totalPrice = pricePerKg * parcel.weightKg;
  return (
    <>
      <Stack>
        <span>
          <CardLabel variant={"parcel"} label={label} />
          <ButtomSpacer />
        </span>
        <RouteRow
          origin={parcel.route.originCountry}
          destination={parcel.route.destinationCountry}
        />
        <IconTextRow
          iconSize="md"
          Icon={META_ICONS.userIconOutlined}
          label={parcel.user.fullName}
        />
        <CategoryRow tag={"sender"} category={items} />
        <WeightRow weight={parcel.weightKg} />
      </Stack>
      <LineDivider />
      <Price
        unitPriceLabel={"Price per kg"}
        unitPrice={pricePerKg}
        totalPrice={totalPrice}
        location={"USA"}
      />
    </>
  );
}
