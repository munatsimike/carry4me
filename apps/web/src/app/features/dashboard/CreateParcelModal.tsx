import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import FormModal from "./components/FormModal";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupabaseParcelRepository } from "../parcels/data/SupabaseCreateParcelRepository";
import { useMemo } from "react";
import { CreateParcelUseCase } from "../parcels/application/CreateParcelUseCase";
import type { CreateParcel } from "../parcels/domain/CreateParcel";
import { useAuthState } from "@/app/shared/supabase/AuthState";

const parcelSchema = z.object({});

type FormFields = z.infer<typeof parcelSchema>;

export default function CreatParcelModal({
  showModal,
  setModalState,
}: {
  showModal: boolean;
  setModalState: (v: boolean) => void;
}) {
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const creteParceUseCase = useMemo(
    () => new CreateParcelUseCase(parcelRepo),
    [parcelRepo],
  );
  const { register, handleSubmit, watch } = useForm<FormFields>({
    resolver: zodResolver(parcelSchema),
    defaultValues: {},
    mode: "onSubmit",
  });

  const { userId, userLoggedIn } = useAuthState();

  const createParcel: CreateParcel = {
    senderUserId: userId ? userId : "",
    originCountry: "Malawi",
    originCity: "Lilongwe",
    destinationCountry: "Zimbabwe",
    destinationCity: "Harare",
    weightKg: 10,
    items: [
      {
        quantity: 1,
        description: "jeans",
      },
    ],
  };
  const onValid = async () => {
    try {
      await creteParceUseCase.execute(createParcel);
      console.log("Parcel created");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <FormModal
      onSubmit={handleSubmit(onValid)}
      onClose={() => setModalState(false)}
    >
      <>
        <LineDivider />
        <LineDivider />
        <LineDivider />
        <DescriptionQuantityRow />
        <LineDivider />
      </>
    </FormModal>
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
/*
function GoodsWeightRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-start">
      <div className="flex flex-col gap-3 max-w-sm">
        <CustomText>{"What are you sending?"}</CustomText>
        <DropDownMenu
        register={..register}
          className="md"
          placeholder="Select Goods"
          menuItems={[]}
          value=""
   
        />
      </div>

      <div className="flex flex-col gap-3">
        <CustomText>{"Weight?"}</CustomText>
        <FloatingInputField />
      </div>
    </div>
  );
}*/
