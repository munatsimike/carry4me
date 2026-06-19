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
