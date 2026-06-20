import type { GoodsCategory } from "./GoodsCategory";

export const ALL_GOODS_CATEGORY_SLUG = "all";
export const ALL_GOODS_CATEGORY_NAME = "All";
export const ALL_GOODS_CATEGORY_TRIP_DISPLAY = "Any item";

export function isAllGoodsCategory(
  category: Pick<GoodsCategory, "slug" | "name">,
): boolean {
  return (
    category.slug === ALL_GOODS_CATEGORY_SLUG ||
    category.name === ALL_GOODS_CATEGORY_NAME
  );
}

export function sortTripGoodsCategories(
  categories: GoodsCategory[],
): GoodsCategory[] {
  const allCategory = categories.find(isAllGoodsCategory);
  const specificCategories = categories.filter(
    (category) => !isAllGoodsCategory(category),
  );

  return allCategory ? [allCategory, ...specificCategories] : specificCategories;
}

/** Trip listing cards/reviews: show "Any item" when traveler accepts all categories. */
export function formatTripAcceptedCategoryLabels(
  categories: GoodsCategory[],
): string[] {
  if (categories.some(isAllGoodsCategory)) {
    return [ALL_GOODS_CATEGORY_TRIP_DISPLAY];
  }

  return categories.map((category) => category.name);
}

export function tripAcceptsAllCategories(categories: GoodsCategory[]): boolean {
  return categories.some(isAllGoodsCategory);
}

function categoryMatchKeys(
  category: Pick<GoodsCategory, "id" | "slug" | "name">,
): string[] {
  return [category.id, category.slug, category.name]
    .map((value) => value?.trim().toLowerCase() ?? "")
    .filter(Boolean);
}

/** Every parcel category must be accepted on the trip (by id, slug, or name). */
export function tripAcceptsParcelCategories(
  tripCategories: GoodsCategory[],
  parcelCategories: GoodsCategory[],
): boolean {
  if (tripAcceptsAllCategories(tripCategories)) {
    return true;
  }

  if (parcelCategories.length === 0 || tripCategories.length === 0) {
    return true;
  }

  const tripCategoryKeys = new Set(
    tripCategories.flatMap((category) => categoryMatchKeys(category)),
  );

  return parcelCategories.every((parcelCategory) => {
    const keys = categoryMatchKeys(parcelCategory);
    return keys.some((key) => tripCategoryKeys.has(key));
  });
}

/** At least one parcel category must be accepted on the trip (by id, slug, or name). */
export function tripAcceptsAnyParcelCategory(
  tripCategories: GoodsCategory[],
  parcelCategories: GoodsCategory[],
): boolean {
  if (tripAcceptsAllCategories(tripCategories)) {
    return true;
  }

  if (parcelCategories.length === 0 || tripCategories.length === 0) {
    return true;
  }

  const tripCategoryKeys = new Set(
    tripCategories.flatMap((category) => categoryMatchKeys(category)),
  );

  return parcelCategories.some((parcelCategory) => {
    const keys = categoryMatchKeys(parcelCategory);
    return keys.some((key) => tripCategoryKeys.has(key));
  });
}
