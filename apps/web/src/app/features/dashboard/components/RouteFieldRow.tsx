import DropDownMenu from "@/app/components/DropDownMenu";
import ErrorText from "@/app/components/text/ErrorText";
import CustomText from "@/components/ui/CustomText";
import type { UseFormRegisterReturn } from "react-hook-form";

export default function RouteFieldRow({
  countryValue,
  cityValue,
  registerCountry,
  registerCity,
  countryError,
  cityError,
}: {
  cityError?: string;
  countryError?: string;
  countryValue: string;
  cityValue: string;
  registerCountry: UseFormRegisterReturn;
  registerCity: UseFormRegisterReturn;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4">
        <span className="grid grid-cols-[96px_1fr] items-center gap-4">
          <CustomText className="text-right" textSize="xsm">
            {"Destination :"}
          </CustomText>
          <span >
            <CustomText as="span" textSize="xsm" textVariant="formText" className="inline-flex bg-neutral-100 rounded-full px-4 py-2">
              {"Zimbabwe"}
            </CustomText>
          </span>
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
      </div>{" "}
      {(cityError || countryError) && (
        <ErrorText error="Select country and city" />
      )}
    </div>
  );
}
