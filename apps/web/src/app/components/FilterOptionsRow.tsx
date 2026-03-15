import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Calendar,
  ChevronDown,
  Package,
  Scale,
  ArrowUpDown,
  PoundSterling,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { CustomRange } from "@/types/Ui";

type FiltersFormValues = {
  date: string;
  minPrice: string;
  maxPrice: string;
  minSpace: string;
  maxSpace: string;
  categories: string[];
  sort: string;
};

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
      <span className="text-sm font-semi-medium text-neutral-800">{label}</span>
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
  onApply?: (values: FiltersFormValues) => void;
  setSelectedDate: (s: string) => void;
  setFilteredList: () => void;
  setFilterByPrice: (p: CustomRange) => void;
};

const categoryOptions = [
  "Documents",
  "Clothes",
  "Shoes",
  "Electronics",
  "Health & Beauty",
];

const sortOptions = [
  { label: "Earliest departure", value: "date-asc" },
  { label: "Lowest price", value: "price-asc" },
  { label: "Highest price", value: "price-desc" },
  { label: "Most space", value: "space-desc" },
];

export function FilterOptionsRow({
  onApply,
  setSelectedDate,
  setFilteredList,
  setFilterByPrice,
}: FilterOptionsRowProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { dirtyFields },
  } = useForm<FiltersFormValues>({
    defaultValues: {
      date: "",
      minPrice: "0",
      maxPrice: "",
      minSpace: "",
      maxSpace: "",
      categories: [],
      sort: "",
    },
  });

  const values = watch();

  const hasDate = !!values.date;
  const hasPrice = !!values.maxPrice;
  const hasSpace = !!values.minSpace || !!values.maxSpace;
  const hasCategory = values.categories.length > 0;
  const hasSort = !!values.sort;

  const hasAnyFilter =
    hasDate || hasPrice || hasSpace || hasCategory || hasSort;

  const toggleMenu = (menuName: string) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const closeMenu = () => setOpenMenu(null);

  const submitFilters = handleSubmit((formValues) => {
    if (!!dirtyFields.date && setSelectedDate) {
      setSelectedDate(formValues.date);
    }

    if (!!dirtyFields.maxPrice) {
      setFilterByPrice({
        min: Number(formValues.minPrice),
        max: Number(formValues.maxPrice),
      });
    }
    //onApply?.(formValues);
    closeMenu();
  });

  const clearFilters = () => {
    if (setFilteredList) {
      setFilteredList();
      setSelectedDate("");
      setFilterByPrice({ min: 0, max: 0 });
    }
    reset();
    onApply?.({
      date: "",
      minPrice: "0",
      maxPrice: "",
      minSpace: "",
      maxSpace: "",
      categories: [],
      sort: "",
    });
    closeMenu();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-md text-neutral-500">Filter by</span>

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
              <label className="mb-2 block text-sm font-medium text-primary-900">
                Departure date
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                onClick={() => {
                  setValue("date", "");
                  submitFilters();
                }}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm text-white"
              >
                Apply
              </button>
            </div>
          </form>
        </Popover>
      </FilterMenuWrapper>

      <FilterMenuWrapper>
        <FilterChip
          label="Price"
          icon={<PoundSterling className="h-4 w-4" />}
          active={hasPrice}
          isOpen={openMenu === "price"}
          onClick={() => toggleMenu("price")}
        />
        <Popover open={openMenu === "price"}>
          <form onSubmit={submitFilters} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-900">
                Price range
              </label>
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

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("minPrice", "");
                  setValue("maxPrice", "");
                  submitFilters();
                }}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm text-white"
              >
                Apply
              </button>
            </div>
          </form>
        </Popover>
      </FilterMenuWrapper>

      <FilterMenuWrapper>
        <FilterChip
          label="Available space"
          icon={<Scale className="h-4 w-4" />}
          active={hasSpace}
          isOpen={openMenu === "space"}
          onClick={() => toggleMenu("space")}
        />
        <Popover open={openMenu === "space"}>
          <form onSubmit={submitFilters} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-900">
                Available space (kg)
              </label>
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

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("minSpace", "");
                  setValue("maxSpace", "");
                  submitFilters();
                }}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm text-white"
              >
                Apply
              </button>
            </div>
          </form>
        </Popover>
      </FilterMenuWrapper>

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
              <label className="mb-3 block text-sm font-medium text-primary-900">
                Accepted items
              </label>

              <Controller
                control={control}
                name="categories"
                render={({ field }) => (
                  <div className="space-y-2">
                    {categoryOptions.map((category) => {
                      const checked = field.value.includes(category);

                      return (
                        <label
                          key={category}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, category]);
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (item) => item !== category,
                                  ),
                                );
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-primary-900">
                            {category}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("categories", []);
                  submitFilters();
                }}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm text-white"
              >
                Apply
              </button>
            </div>
          </form>
        </Popover>
      </FilterMenuWrapper>

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
              <label className="mb-3 block text-sm font-medium text-primary-900">
                Sort by
              </label>

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
                        <span className="text-sm text-primary-900">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue("sort", "");
                  submitFilters();
                }}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm text-white"
              >
                Apply
              </button>
            </div>
          </form>
        </Popover>
      </FilterMenuWrapper>

      <AnimatePresence>
        {hasAnyFilter && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            trinsition={{ duration: 0.3, ease: "easeInOut" }}
            exit={{ opacity: 0, x: -8 }}
            type="button"
            onClick={clearFilters}
            className="ml-1 text-sm font-medium text-primary-500 hover:underline"
          >
            Clear filters
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
