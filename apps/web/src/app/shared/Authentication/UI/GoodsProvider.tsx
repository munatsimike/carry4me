// src/Goods/GoodsContext.tsx
import { GetGoodsUseCase } from "@/app/features/goods/application/GetGoodsUseCase";
import { SupabaseGoodsRepository } from "@/app/features/goods/data/SupabaseGoodsRepository";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { namedCall } from "../application/NamedCall";

type GoodsState = {
  goodsCategories: GoodsCategory[];
  loading: boolean;
  error: string | null;

  /** Ensures categories are loaded (cached). Safe to call many times. */
  ensureGoodsLoaded: () => Promise<void>;

  /** Force refetch (ignores cache). */
  refreshGoods: () => Promise<void>;

  /** Clears cache (optional). */
  clearGoods: () => void;
};

const GoodsContext = createContext<GoodsState | null>(null);

export function GoodsProvider({ children }: { children: React.ReactNode }) {
  const [goodsCategories, setGoodsCategories] = useState<GoodsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const getGoodsUseCase = useMemo(
    () => new GetGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  // Prevent duplicate parallel fetches if multiple pages/modals call it at once
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchGoods = useCallback(
    async (opts?: { force?: boolean }) => {
      const force = opts?.force ?? false;

      if (!force && goodsCategories.length > 0) return;

      // If there is already a request running, reuse it
      if (inFlightRef.current) return inFlightRef.current;

      const run = (async () => {
        setLoading(true);
        setError(null);

        async function doFetch() {
          const { result } = await namedCall(
            "goods",
            getGoodsUseCase.execute(),
          );
          if (!result.success) {
            setError(result.error ? "Failed to load goods categories" : "");
            showSupabaseError(result.error, result.status, {
              onRetry: doFetch,
            });
            return;
          }
          setGoodsCategories(result.data);
        }

        try {
          await doFetch();
        } finally {
          setLoading(false);
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = run;
      return run;
    },
    [getGoodsUseCase, goodsCategories.length],
  );

  const ensureGoodsLoaded = useCallback(async () => {
    await fetchGoods({ force: false });
  }, [fetchGoods]);

  const refreshGoods = useCallback(async () => {
    // Clear first so it really refetches
    setGoodsCategories([]);
    await fetchGoods({ force: true });
  }, [fetchGoods]);

  const clearGoods = useCallback(() => {
    setGoodsCategories([]);
    setError(null);
  }, []);

  const value = useMemo<GoodsState>(
    () => ({
      goodsCategories,
      loading,
      error,
      ensureGoodsLoaded,
      refreshGoods,
      clearGoods,
    }),
    [
      goodsCategories,
      loading,
      error,
      ensureGoodsLoaded,
      refreshGoods,
      clearGoods,
    ],
  );

  return (
    <GoodsContext.Provider value={value}>{children}</GoodsContext.Provider>
  );
}

export function useGoods() {
  const ctx = useContext(GoodsContext);
  if (!ctx) throw new Error("useGoods must be used within a GoodsProvider");
  return ctx;
}

function showSupabaseError(error: unknown, status: number | null | undefined, arg2: { onRetry: () => Promise<void>; }) {
  throw new Error("Function not implemented.");
}

