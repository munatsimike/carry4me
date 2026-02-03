import FloatingInputField from "@/app/components/CustomInputField";

import DropDownMenu from "@/app/components/DropDownMenu";
import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import FormContainer from "./components/FormModal";

export default function CreatParcelModal({
  // showModal,
  setModalState,
}: {
  showModal: boolean;
  setModalState: (v: boolean) => void;
}) {
  return (
    // <FormContainer handleSubmit={()=>void} showModal={showModal} onClick={setModalState}>
    <>
      <LineDivider />
      <LineDivider />
      <GoodsWeightRow />
      <LineDivider />
      <DescriptionQuantityRow />
      <LineDivider />
    </>
    // </FormContainer>
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
