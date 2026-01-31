import FloatingInputField from "@/app/components/CustomInputField";
import CustomModal from "@/app/components/CustomModal";
import DropDownMenu from "@/app/components/DropDownMenu";
import LineDivider from "@/app/components/LineDivider";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { Button } from "@/components/ui/Button";
import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { CreateTripUseCase } from "../trips/application/CreateTripUsecase";
import type { User } from "@supabase/supabase-js";
import type { CreateTrip } from "../trips/domain/CreateTrip";

const trip: CreateTrip = {
  originCountry: "UK",
  originCity: "London",
  destinationCountry: "Zimbabwe",
  destinationCity: "Harare",
  departureDate: "2026-01-26",
  arrivalDate: null,
  capacityKg: 8,
  pricePerKg: 20,
};
export default function CreatParcelModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
}) {
  return (
    <CustomModal onClose={() => setShowModal(!showModal)}>
      <div className="flex flex-col gap-4 w-full sm:w-[600px] px-4">
        <Header />
        <LineDivider />
        <Route />
        <LineDivider />
        <GoodsWeightRow />
        <LineDivider />
        <DescriptionQuantityRow />
        <LineDivider />
      </div>
    </CustomModal>
  );
}

function DescriptionQuantityRow() {
  return (
    <div className="inline-flex flex-col gap-4">
      <div>
        <CustomText textVariant="primary">
          {"Contents of your package"}
        </CustomText>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FloatingInputField label="Description e.g jeans" />
        <FloatingInputField label="quantity" />
      </div>
      <Button
        className="max-w-sm"
        variant={"neutral"}
        size={"lg"}
        leadingIcon={undefined}
      >
        <CustomText textVariant="primary">{"Add item"}</CustomText>
      </Button>
    </div>
  );
}

function GoodsWeightRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-start">
      <div className="flex flex-col gap-3 max-w-sm">
        <CustomText>{"What are you sending?"}</CustomText>
        <DropDownMenu
          roundedClassName="md"
          placeholder="Select Goods"
          menuItems={[]}
          value=""
          onChange={() => {}}
        />
      </div>

      <div className="flex flex-col gap-3">
        <CustomText>{"Weight?"}</CustomText>
        <FloatingInputField />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <CircleBadge size="lg" bgColor="parcel">
        <SvgIcon
          size={"xxl"}
          color="primary"
          Icon={META_ICONS.parcelBox}
        ></SvgIcon>
      </CircleBadge>
      <span className="flex flex-col gap2 items-center">
        <CustomText className="primary" textSize="lg">
          {"Post a parcel"}
        </CustomText>
        <CustomText textSize="xsm" as="h2">
          {"Share your parcel details to match with travelers."}
        </CustomText>
      </span>
    </div>
  );
}

function Route() {
  return (
    <div className="flex flex-col gap-4">
      <span className="grid grid-cols-[96px_1fr] items-center gap-4">
        <CustomText className="text-right" textSize="xsm">
          {"Origin :"}
        </CustomText>
        <span className="inline-flex gap-6">
          <DropDownMenu
            roundedClassName="md"
            placeholder={"Select country"}
            menuItems={[]}
            value={""}
            onChange={function (value: string): void {
              throw new Error("Function not implemented.");
            }}
          />

          <DropDownMenu
            roundedClassName="md"
            placeholder={"Select city"}
            menuItems={[]}
            value={""}
            onChange={function (value: string): void {
              throw new Error("Function not implemented.");
            }}
          />
        </span>
      </span>
      <span className="grid grid-cols-[96px_1fr] items-center gap-4">
        <CustomText className="text-right" textSize="xsm">
          {"Destination :"}
        </CustomText>
        <CustomText textSize="xsm">{"Zimbabwe:"}</CustomText>
      </span>
    </div>
  );
}
async function createTrip(
  loading: boolean,
  user: User,
  useCase: CreateTripUseCase,
) {
  if (loading || !user) return;

  try {
    await useCase.execute(user.id, trip);
    console.log("Trip created");
  } catch (e) {
    console.error(e);
  }
}
