import DropDownMenu from "@/app/components/DropDownMenu";
import CustomText from "@/components/ui/CustomText";
import type { UseFormRegisterReturn } from "react-hook-form";

export default function RouteFieldRow({
  countryValue,
  cityValue,
  registerCountry,
  registerCity,
}: {
  countryValue: string;
  cityValue: string;
  registerCountry: UseFormRegisterReturn;
  registerCity: UseFormRegisterReturn;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="grid grid-cols-[96px_1fr] items-center gap-4">
        <CustomText className="text-right" textSize="xsm">
          {"Destination :"}
        </CustomText>
        <CustomText textSize="xsm" textVariant="formText">
          {"Zimbabwe"}
        </CustomText>
      </span>
      <span className="grid grid-cols-[96px_1fr] items-center gap-4">
        <CustomText className="text-right" textSize="xsm">
          {"Origin :"}
        </CustomText>
        <span className="inline-flex gap-4">
          <DropDownMenu
            value={countryValue}
            className="rounded-lg bg-white border"
            placeholder={"Select country"}
            menuItems={["Ireland", "United Kingdom", "USA"]}
            register={registerCountry}
          />

          <DropDownMenu
            value={cityValue}
            register={registerCity}
            className="rounded-lg bg-white border"
            placeholder={"Select city"}
            menuItems={["Dublin", "London", "Florida"]}
          />
        </span>
      </span>
    </div>
  );
}
