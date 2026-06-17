import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useGoodsCategories } from "@/app/hooks/queries/useGoodsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import type { CustomRange, SortOption } from "@/types/Ui";

export type FiltersFormValues = {
  date: string;
  minPrice: string;
  maxPrice: string;
  minSpace: string;
  maxSpace: string;
  categories: string[];
  sort: SortOption | undefined;
};

type FilterState = {
  date: string;
  minPrice: string;
  maxPrice: string;
  minSpace: string;
  maxSpace: string;
  categories: string[];
  sort?: SortOption;
};

const filterDefaults: FilterState = {
  date: "",
  minPrice: "0",
  maxPrice: "",
  minSpace: "1",
  maxSpace: "",
  categories: [],
  sort: undefined,
};

type UseFiltersFormProps = {
  setSelectedDate: (s: string) => void;
  setPriceRange: (v: CustomRange) => void;
  setWeightRange: (v: CustomRange) => void;
  setGoodsCategory: (s: string[]) => void;
  setSortOption: (v: SortOption | undefined) => void;
};

export function useFiltersForm({
  setSelectedDate,
  setPriceRange,
  setWeightRange,
  setGoodsCategory,
  setSortOption,
}: UseFiltersFormProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { data, error } = useGoodsCategories();
  useQueryErrorEffect(error);

  const goodsCategory: GoodsCategory[] = useMemo(() => data ?? [], [data]);

  const form = useForm<FiltersFormValues>({
    defaultValues: filterDefaults,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { dirtyFields },
  } = form;

  const values = watch();

  const hasDate = !!values.date;
  const hasPrice = !!values.maxPrice;
  const hasSpace = !!values.maxSpace;
  const hasCategory = values.categories.length > 0;
  const hasSort = !!values.sort;

  const hasFilter =
    hasDate || hasPrice || hasSpace || hasCategory || hasSort;

  const toggleMenu = (menuName: string) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const closeMenu = () => setOpenMenu(null);

  const submitFilters = handleSubmit((formValues) => {
    if (dirtyFields.date) {
      setSelectedDate(formValues.date);
    }

    if (dirtyFields.maxPrice) {
      setPriceRange({
        min: Number(formValues.minPrice),
        max: Number(formValues.maxPrice),
      });
    }

    if (dirtyFields.maxSpace) {
      setWeightRange({
        min: Number(formValues.minSpace),
        max: Number(formValues.maxSpace),
      });
    }

    if (dirtyFields.categories) {
      setGoodsCategory(formValues.categories);
    }

    if (dirtyFields.sort) {
      setSortOption(formValues.sort);
    }

    closeMenu();
  });

  const clearFilters = () => {
    setSelectedDate("");
    setPriceRange({ min: 0, max: 0 });
    setWeightRange({ min: 0, max: 0 });
    setGoodsCategory([]);
    setSortOption(undefined);
    reset(filterDefaults);
  };

  const handleClearAndClose = () => {
    clearFilters();
    closeMenu();
  };

  return {
    register,
    control,
    setValue,
    openMenu,
    toggleMenu,
    closeMenu,
    submitFilters,
    clearFilters,
    handleClearAndClose,
    goodsCategory,
    hasDate,
    hasPrice,
    hasSpace,
    hasCategory,
    hasSort,
    hasFilter,
  };
}
