import { Button } from "@/components/ui/Button";
import DropDownMenu from "./DropDownMenu";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "../icons/MetaIcon";

type SearchProps = {
  selectedCountry: string;
  selectedCity: string;
  countries: string[];
  cities: string[];
  onCountryChange: (country: string) => void;
  onCityChange: (country: string) => void;
  onClick: () => void;
};

export default function Search({
  selectedCountry,
  selectedCity,
  countries,
  cities,
  onCountryChange,
  onCityChange,
  onClick,
}: SearchProps) {
  return (
    <div className="inline-flex items-center gap-5 py-2 px-4 bg-canvas rounded-full">
      <DropDownMenu
        value={selectedCountry}
        placeholder="Select country"
        onChange={(c) => {
          (onCountryChange(c), onCityChange(""));
        }}
        menuItems={countries}
      />
      <DropDownMenu
        value={selectedCity}
        placeholder="Select city"
        onChange={onCityChange}
        menuItems={cities}
        disabled={selectedCountry === ""}
      />

      <CustomText as="span" textSize="xsm">
        {"To : Zimbabwe"}
      </CustomText>
      <Button
        onClick={onClick}
        variant={"primary"}
        size={"xsm"}
        leadingIcon={
          <SvgIcon color="onDark" size={"sm"} Icon={META_ICONS.searchIcon} />
        }
      >
        <CustomText textSize="xsm" textVariant="onDark">
          {"Search"}
        </CustomText>
      </Button>
    </div>
  );
}
