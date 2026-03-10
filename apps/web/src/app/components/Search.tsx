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
}: SearchProps) {
  return (
    <div className="inline-flex items-center gap-5 py-2 px-4 bg-neutral-50 rounded-xl border border-neutral-300 shadow-sm">
      <DropDownMenu
        className="rounded-xl shadow-sm"
        value={selectedCountry}
        placeholder="Select country"
        menuItems={countries}
      />
      <DropDownMenu
        className="rounded-xl shadow-sm"
        value={selectedCity}
        placeholder="Select city"
        menuItems={cities}
      />

      <CustomText as="span" textSize="xsm">
        {"to Zimbabwe"}
      </CustomText>
      <Button
      cornerRadiusClass="rounded-xl"
        variant={"primary"}
        size={"sm"}
        leadingIcon={
          <SvgIcon color="onDark" size={"sm"} Icon={META_ICONS.searchIcon} />
        }
      >
        <CustomText textSize="sm" textVariant="onDark">
          {"Search"}
        </CustomText>
      </Button>
    </div>
  );
}
