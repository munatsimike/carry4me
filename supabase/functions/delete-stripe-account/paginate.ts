import { STRIPE_LIST_MAX_PAGES, STRIPE_LIST_PAGE_SIZE } from "./constants.ts";

export type StripeListPage<T> = {
  data: T[];
  has_more?: boolean;
};

export type PagedStripeResult<T> = {
  items: T[];
  complete: boolean;
};

export async function collectStripePages<T extends { id?: string }>(
  fetchPage: (params: { limit: number; starting_after?: string }) => Promise<StripeListPage<T>>,
  options: { maxPages?: number; pageSize?: number } = {},
): Promise<PagedStripeResult<T>> {
  const maxPages = options.maxPages ?? STRIPE_LIST_MAX_PAGES;
  const pageSize = options.pageSize ?? STRIPE_LIST_PAGE_SIZE;
  const items: T[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const result = await fetchPage({
      limit: pageSize,
      starting_after: startingAfter,
    });

    if (!result || !Array.isArray(result.data)) {
      return { items, complete: false };
    }

    items.push(...result.data);

    if (!result.has_more) {
      return { items, complete: true };
    }

    const lastId = result.data[result.data.length - 1]?.id?.trim();
    if (!lastId) {
      return { items, complete: false };
    }
    startingAfter = lastId;
  }

  return { items, complete: false };
}

export type CountedPage<T> = {
  data: T[] | null;
  count: number | null;
  error?: unknown;
};

export async function collectCountedPages<T>(
  fetchPage: (from: number, to: number) => Promise<CountedPage<T>>,
  options: { pageSize: number; maxPages: number },
): Promise<PagedStripeResult<T>> {
  const items: T[] = [];
  let from = 0;

  for (let page = 0; page < options.maxPages; page += 1) {
    const to = from + options.pageSize - 1;
    const result = await fetchPage(from, to);

    if (result.error || !Array.isArray(result.data) || result.count == null) {
      return { items, complete: false };
    }

    const remaining = Math.max(result.count - from, 0);
    const expected = Math.min(options.pageSize, remaining);
    if (result.data.length !== expected) {
      return { items, complete: false };
    }

    items.push(...result.data);

    if (from + result.data.length >= result.count) {
      return { items, complete: true };
    }

    from += options.pageSize;
  }

  return { items, complete: false };
}
