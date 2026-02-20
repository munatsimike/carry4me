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
        <div className="flex">
        <span className="grid grid-cols-[96px_1fr] items-center gap-4">
          <CustomText className="text-right" textSize="xsm" textVariant="label">
            {"Origin"}
          </CustomText>
          <span className="inline-flex gap-4">
            <DropDownMenu
              value={countryValue}
              className="rounded-md bg-white border"
              placeholder={"Select country"}
              menuItems={["Ireland", "United Kingdom", "USA"]}
              register={registerCountry}
            />

            <DropDownMenu
              value={cityValue}
              register={registerCity}
              className="rounded-md bg-white border"
              placeholder={"Select city"}
              menuItems={["Dublin", "London", "Florida"]}
            />
          </span>
        </span>

        </div>
        <span className="grid grid-cols-[96px_1fr] items-center gap-3">
          <CustomText className="text-right" textSize="xsm" textVariant="label">
            {"Destination"}
          </CustomText>

          <span className="pl-1">
            <CustomText
              as="span"
              textSize="xsm"
              textVariant="secondary"
              className="inline-flex rounded-lg bg-neutral-50 border border-100 w-fit px-3 h-9 justify-center items-center "
            >
              {"Zimbabwe"}
            </CustomText>
          </span>
        </span>
      </div>{" "}
      {(cityError || countryError) && (
        <ErrorText error="Select country and city" />
      )}
    </div>
  );
}
