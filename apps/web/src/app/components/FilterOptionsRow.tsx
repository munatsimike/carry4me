import * as React from "react";
import {
  Controller,
  type UseFormSetValue,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import {
  Calendar,
  ChevronDown,
  Package,
  Scale,
  ArrowUpDown,
  PoundSterling,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { SortOption, Tag } from "@/types/Ui";
import type { GoodsCategory } from "../features/goods/domain/GoodsCategory";
import { checkBox, checkBoxSvg, cn } from "../lib/cn";
import type { Listing } from "../shared/Authentication/domain/Listing";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { DateField } from "../features/dashboard/components/DateField";
import {
  useFiltersForm,
  type FiltersFormValues,
} from "../shared/Authentication/UI/hooks/useFiltersForm";

type FilterChipProps = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  isOpen?: boolean;
  onClick: () => void;
};

function FilterChip({
  label,
  icon,
  active = false,
  isOpen = false,
  onClick,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 transition-colors",
        active || isOpen
          ? "border-primary-500 bg-primary-50"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-100",
      ].join(" ")}
    >
      <span
        className={active || isOpen ? "text-primary-500" : "text-neutral-500"}
      >
        {icon}
      </span>
      <CustomText
        className="font-semi-medium whitespace-nowrap"
        textVariant="primary"
      >
        {label}
      </CustomText>
      <ChevronDown
        className={`h-4 w-4 text-neutral-500 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

type PopoverProps = {
  open: boolean;
  children: React.ReactNode;
};

function Popover({ open, children }: PopoverProps) {
  if (!open) return null;

  return (
    <div className="absolute left-0 top-full z-20 mt-2 min-w-[280px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      {children}
    </div>
  );
}

type FilterMenuWrapperProps = {
  children: React.ReactNode;
};

function FilterMenuWrapper({ children }: FilterMenuWrapperProps) {
  return <div className="relative">{children}</div>;
}

type FilterOptionsRowProps = {
  filterForm: ReturnType<typeof useFiltersForm>;
  setMobileFilter: () => void;
  tag?: Tag;
};

const basSortOptions: { label: string; value: SortOption }[] = [
  { label: "Lowest price", value: "price-asc" },
  { label: "Highest price", value: "price-desc" },
];

const tripSortOptions: { label: string; value: SortOption }[] = [
  ...basSortOptions,
  { label: "Earliest departure", value: "date-asc" },
  { label: "Most space", value: "weight-desc" },
];

const parcelSortOptions: { label: string; value: SortOption }[] = [
  ...basSortOptions,
  { label: "Max weight", value: "weight-desc" },
];

export function FilterOptionsRow({
  filterForm,
  setMobileFilter,
  tag = "traveler",
}: FilterOptionsRowProps) {
  const {
    register,
    control,
    setValue,
    openMenu,
    toggleMenu,
    closeMenu,
    submitFilters,
    clearFilters,
    goodsCategory,
    hasDate,
    hasPrice,
    hasSpace,
    hasCategory,
    hasSort,
    hasFilter,
  } = filterForm;

  const isTraveler = tag === "traveler";

  return (
    <div className="flex flex-col md:flex-row gap-3 pb-2 items-start md:items-center">
      <span className="text-md text-neutral-500 whitespace-nowrap">
        Filter by
      </span>

      {isTraveler && (
        <FilterByDate
          hasDate={hasDate}
          baseProps={{
            register: register,
            openMenu: openMenu,
            toggleMenu: toggleMenu,
            submitFilters: submitFilters,
            control: control,
            setValue: setValue,
          }}
        />
      )}

      <FilterByPriceMenu
        isTraveler={isTraveler}
        hasPrice={hasPrice}
        baseProps={{
          register: register,
          openMenu: openMenu,
          toggleMenu: toggleMenu,
          submitFilters: submitFilters,
          control: control,
          setValue: setValue,
        }}
      />

      <FilterByWeightMenu
        isTraveler={isTraveler}
        hasSpace={hasSpace}
        baseProps={{
          register: register,
          openMenu: openMenu,
          toggleMenu: toggleMenu,
          submitFilters: submitFilters,
          control: control,
          setValue: setValue,
        }}
      />

      <FilterByGoodsMenu
        hasCategory={hasCategory}
        goodsCategory={goodsCategory}
        baseProps={{
          register: register,
          openMenu: openMenu,
          toggleMenu: toggleMenu,
          submitFilters: submitFilters,
          control: control,
          setValue: setValue,
        }}
      />
      <SortMenu
        isTraveler={isTraveler}
        hasSort={hasSort}
        baseProps={{
          register: register,
          openMenu: openMenu,
          toggleMenu: toggleMenu,
          submitFilters: submitFilters,
          control: control,
          setValue: setValue,
        }}
      />

      <div className="flex justify-between w-full">
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            trinsition={{ duration: 0.5, ease: "easeInOut" }}
            exit={{ opacity: 0, y: -8 }}
            type="button"
            disabled={!hasFilter}
            onClick={clearFilters}
            className={cn(
              "ml-1 text-sm whitespace-nowrap",
              hasFilter
                ? "text-primary-500 hover:underline"
                : "text-neutral-500",
            )}
          >
            Clear filters
          </motion.button>
        </AnimatePresence>
        <button
          type="button"
          onClick={() => {
            setMobileFilter();
            closeMenu();
          }}
          className="md:hidden rounded-full bg-primary-500 px-4 py-1 text-sm text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}
type BaseProps = {
  openMenu: any;
  toggleMenu: (v: string) => void;
  submitFilters: () => void;
  control: Control<FiltersFormValues>;
  setValue: UseFormSetValue<FiltersFormValues>;
  register: UseFormRegister<FiltersFormValues>;
};

type ActionButtonProps = {
  setValue: UseFormSetValue<FiltersFormValues>;
  submitFilters: () => void;
};

function ActionButton({ setValue, submitFilters }: ActionButtonProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        type="button"
        onClick={() => {
          setValue("minPrice", "0");
          setValue("maxPrice", "");
          submitFilters();
        }}
      >
        Clear
      </Button>
      <Button
        size="sm"
        variant="primary"
        type="submit"
        className="rounded-xl bg-primary-500 px-4 py-2 text-sm text-white"
      >
        Apply
      </Button>
    </div>
  );
}

type FilterByDateProps = {
  baseProps: BaseProps;
  hasDate: boolean;
};
function FilterByDate({ hasDate, baseProps }: FilterByDateProps) {
  const { openMenu, toggleMenu, submitFilters, setValue, control } = baseProps;
  return (
    <FilterMenuWrapper>
      <FilterChip
        label="Date"
        icon={<Calendar className="h-4 w-4" />}
        active={hasDate}
        isOpen={openMenu === "date"}
        onClick={() => toggleMenu("date")}
      />
      <Popover open={openMenu === "date"}>
        <form onSubmit={submitFilters} className="space-y-4">
          <div>
            <CustomText
              textVariant="primary"
              as="label"
              className="mb-2 block font-medium"
            >
              Departure date
            </CustomText>

            <DateField<FiltersFormValues>
              control={control}
              name={"date"}
              label=""
            />
          </div>

          <ActionButton setValue={setValue} submitFilters={submitFilters} />
        </form>
      </Popover>
    </FilterMenuWrapper>
  );
}
type FilterByPriceProps = {
  baseProps: BaseProps;
  hasPrice: boolean;
  isTraveler: boolean;
};

function FilterByPriceMenu({
  baseProps,
  isTraveler,
  hasPrice,
}: FilterByPriceProps) {
  const { openMenu, toggleMenu, submitFilters, setValue, register } = baseProps;
  return (
    <FilterMenuWrapper>
      <FilterChip
        label={isTraveler ? "Price" : "Budget"}
        icon={<PoundSterling className="h-4 w-4" />}
        active={hasPrice}
        isOpen={openMenu === "price"}
        onClick={() => toggleMenu("price")}
      />
      <Popover open={openMenu === "price"}>
        <form onSubmit={submitFilters} className="space-y-4">
          <div>
            <CustomText
              as="label"
              textVariant="primary"
              className="mb-2 block font-medium"
            >
              {isTraveler ? " Price range" : "Budget range"}
            </CustomText>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                placeholder="Min"
                {...register("minPrice")}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                {...register("maxPrice")}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
            </div>
          </div>
          <ActionButton setValue={setValue} submitFilters={submitFilters} />
        </form>
      </Popover>
    </FilterMenuWrapper>
  );
}

type WeightMenuProps = {
  baseProps: BaseProps;
  hasSpace: boolean;
  isTraveler: boolean;
};

function FilterByWeightMenu({
  baseProps,
  hasSpace,
  isTraveler,
}: WeightMenuProps) {
  const { openMenu, toggleMenu, submitFilters, setValue, register } = baseProps;
  return (
    <FilterMenuWrapper>
      <FilterChip
        label={isTraveler ? "Available space" : "Parcel weight"}
        icon={<Scale className="h-4 w-4" />}
        active={hasSpace}
        isOpen={openMenu === "space"}
        onClick={() => toggleMenu("space")}
      />
      <Popover open={openMenu === "space"}>
        <form onSubmit={submitFilters} className="space-y-4">
          <div>
            <CustomText
              as="label"
              className="mb-2 block font-medium"
              textVariant="primary"
            >
              {isTraveler ? "Available space (kg)" : "Parcel weight"}
            </CustomText>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                placeholder="Min kg"
                {...register("minSpace")}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
              <input
                type="number"
                min="0"
                placeholder="Max kg"
                {...register("maxSpace")}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <ActionButton setValue={setValue} submitFilters={submitFilters} />
        </form>
      </Popover>
    </FilterMenuWrapper>
  );
}

type SortMenuProps = {
  baseProps: BaseProps;
  hasSort: boolean;
  isTraveler: boolean;
};

function SortMenu({ isTraveler, hasSort, baseProps }: SortMenuProps) {
  const { openMenu, toggleMenu, submitFilters, control, setValue } = baseProps;
  const sortOptions = isTraveler ? tripSortOptions : parcelSortOptions;
  return (
    <FilterMenuWrapper>
      <FilterChip
        label="Sort"
        icon={<ArrowUpDown className="h-4 w-4" />}
        active={hasSort}
        isOpen={openMenu === "sort"}
        onClick={() => toggleMenu("sort")}
      />
      <Popover open={openMenu === "sort"}>
        <form onSubmit={submitFilters} className="space-y-4">
          <div>
            <CustomText
              textVariant="primary"
              as="label"
              className="mb-3 block font-medium"
            >
              Sort by
            </CustomText>

            <Controller
              control={control}
              name="sort"
              render={({ field }) => (
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                    >
                      <input
                        type="radio"
                        name="sort"
                        checked={field.value === option.value}
                        onChange={() => field.onChange(option.value)}
                        className="h-4 w-4"
                      />
                      <CustomText as="span" textVariant="primary">
                        {option.label}
                      </CustomText>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>
          <ActionButton setValue={setValue} submitFilters={submitFilters} />
        </form>
      </Popover>
    </FilterMenuWrapper>
  );
}

type FilterByGoodsMenuProps = {
  goodsCategory: GoodsCategory[];
  hasCategory: boolean;
  baseProps: BaseProps;
};

function FilterByGoodsMenu({
  hasCategory,
  baseProps,
  goodsCategory,
}: FilterByGoodsMenuProps) {
  const { openMenu, toggleMenu, submitFilters, control, setValue } = baseProps;
  return (
    <FilterMenuWrapper>
      <FilterChip
        label="Category"
        icon={<Package className="h-4 w-4" />}
        active={hasCategory}
        isOpen={openMenu === "category"}
        onClick={() => toggleMenu("category")}
      />
      <Popover open={openMenu === "category"}>
        <form onSubmit={submitFilters} className="space-y-4">
          <div>
            <CustomText
              textVariant="primary"
              className="mb-3 block font-medium"
              as="label"
            >
              Accepted items
            </CustomText>

            <Controller
              control={control}
              name="categories"
              render={({ field }) => (
                <div className="space-y-2">
                  {goodsCategory.map((category) => {
                    const checked = field.value?.includes(category.name);

                    return (
                      <label
                        key={category.name}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                      >
                        <span className="relative inline-flex">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, category.name]);
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (item) => item !== category.name,
                                  ),
                                );
                              }
                            }}
                            className={checkBox}
                          />
                          <svg
                            viewBox="0 0 24 24"
                            className={checkBoxSvg}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        <CustomText textVariant="primary">
                          {category.name}
                        </CustomText>
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <ActionButton setValue={setValue} submitFilters={submitFilters} />
        </form>
      </Popover>
    </FilterMenuWrapper>
  );
}

export function sortTrips<T extends Listing>(
  listing: T[],
  sortBy?: SortOption,
): T[] {
  if (!sortBy) return listing;

  const sorted = [...listing];

  switch (sortBy) {
    case "date-asc":
      return sorted.sort(
        (a, b) =>
          new Date(a.departDate).getTime() - new Date(b.departDate).getTime(),
      );

    case "price-asc":
      return sorted.sort((a, b) => a.pricePerKg - b.pricePerKg);

    case "price-desc":
      return sorted.sort((a, b) => b.pricePerKg - a.pricePerKg);

    case "weight-desc":
      return sorted.sort((a, b) => b.weightKg - a.weightKg);

    default:
      return sorted;
  }
}
