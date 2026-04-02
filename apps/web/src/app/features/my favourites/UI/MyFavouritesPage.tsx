import { FilterOptionsRow, sortTrips } from "@/app/components/FilterOptionsRow";
import PageSection from "@/app/components/PageSection";
import Search, { SearchResults } from "@/app/components/Search";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import {
  filterByCountryCity,
  filterByGoodsCategory,
  filterByPriceRange,
  filterByWeightRange,
} from "@/app/util/filters";
import DefaultContainer from "@/components/ui/DefualtContianer";
import type { CustomRange, LayoutContext, SortOption } from "@/types/Ui";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/app/components/EmptyState";
import { GetFavouritesUseCase } from "../application/GetFavouritesUseCase";
import { SupabaseFavouriteRepository } from "../data/SupabaseFavouriteRepository";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import FavouritesList from "./FavouritesList";
import {
  HorizontalMenu,
  type TabItem,
} from "@/app/shared/Authentication/UI/SegmentedTabs";
import { useFiltersForm } from "@/app/shared/Authentication/UI/hooks/useFiltersForm";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { AnimatePresence, motion } from "framer-motion";
import CustomModal from "@/app/components/CustomModal";
import { useOutletContext } from "react-router-dom";
import Toolbar from "@/app/components/MobileFilterOptions";
import { useScrollDirection } from "@/app/shared/Authentication/UI/hooks/useScrollDirection";

export type MyFavTabs = "all" | "trip" | "parcel";

const tabs: TabItem<MyFavTabs>[] = [
  { id: "all", label: "All" },
  { id: "trip", label: "Trip" },
  { id: "parcel", label: "Parcel" },
];

export function MyFavouritesPage() {
  const favouritesRepo = useMemo(() => new SupabaseFavouriteRepository(), []);
  const getFavourites = useMemo(
    () => new GetFavouritesUseCase(favouritesRepo),
    [favouritesRepo],
  );
  const [searchCountry, setSearchCountry] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [clearSearchResults, setClearResults] = useState<boolean>(false);
  const { user } = useAuth();

  const country = searchCountry.toLowerCase().trim();
  const city = searchCity.toLowerCase().trim();
  const isSearchActive = !!country && !!city;
  const [priceRange, setPriceRange] = useState<CustomRange>({
    min: 0,
    max: 0,
  });

  const [weightRange, setWeightRange] = useState<CustomRange>({
    min: 0,
    max: 0,
  });
  const [filterByDate, setFilterByDate] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption | undefined>();
  const [goodsCategory, setGoodsCategory] = useState<string[]>([]);
  const [favListing, setFavListings] = useState<Listing[]>([]);
  const { showSupabaseError } = useUniversalModal();
  const [selectedTab, setSelectedTab] = useState<MyFavTabs>("all");
  const { isSearchOpen, setIsSearchOpen } = useOutletContext<LayoutContext>();
  const [mobileFilter, setMobileFilter] = useState<boolean>(false);
  const isMobile = useMediaQuery();
  const filterForm = useFiltersForm({
    setSelectedDate: setFilterByDate,
    setPriceRange,
    setWeightRange,
    setGoodsCategory,
    setSortOption,
  });

  useEffect(() => {
    async function fetchFavourites() {
      if (!user?.id) return;
      const { result } = await namedCall(
        "fetch fav",
        getFavourites.execute(user.id),
      );

      if (!result.success) {
        showSupabaseError(result.error);
        return;
      }

      if (result.success) {
        setFavListings(result.data);
      }
    }

    fetchFavourites();
  }, [user?.id]);

  const displayedFavourites = useMemo(() => {
    let result = favListing;

    if (isSearchActive) {
      result = filterByCountryCity(searchCity, searchCountry, result);
    }

    if (priceRange.max > 0 || priceRange.min > 0) {
      result = filterByPriceRange(priceRange, result);
    }

    if (weightRange.max > 0 || weightRange.min > 0) {
      result = filterByWeightRange(weightRange, result);
    }

    if (goodsCategory.length > 0) {
      result = filterByGoodsCategory(goodsCategory, result);
    }

    if (sortOption) {
      result = sortTrips(result, sortOption);
    }

    if (selectedTab === "trip" || selectedTab === "parcel") {
      result = result.filter((item) => item.type === selectedTab);
    }

    return result;
  }, [
    favListing,
    isSearchActive,
    searchCity,
    searchCountry,
    filterByDate,
    priceRange,
    weightRange,
    goodsCategory,
    sortOption,
    selectedTab,
  ]);

  const handleLikeUpdate = (id: string) => {
    setTimeout(() => {
      setFavListings((prev) => prev.filter((item) => item.id !== id));
    }, 300);
  };

  const filterContent = (
    <FilterOptionsRow
      filterForm={filterForm}
      setMobileFilter={() => setMobileFilter(false)}
    />
  );

  const { clearFilters, hasFilter } = filterForm;
  const scrollDirection = useScrollDirection();
  const searchContent = (
    <Search
      countries={["UK", "USA"]}
      cities={["London", "Florida"]}
      setSearchCity={setSearchCity}
      setSearchCountry={setSearchCountry}
      setClearResults={() => setClearResults(false)}
      clearResults={clearSearchResults}
    />
  );
  return (
    <>
      <div className="sticky top-[50px] z-40 bg-white border-neutral-200 px-4">
        <AnimatePresence initial={false}>
          {isMobile && scrollDirection === "up" && (
            <motion.div
              key="mobile-filters"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="py-2"
            >
              <Toolbar
                hasActiveFilters={hasFilter}
                onFilter={() => setMobileFilter(true)}
                onClear={clearFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <PageSection>
        <SearchResults
          isSearchActive={isSearchActive}
          searchResults={displayedFavourites.length}
          onClick={() => setClearResults(true)}
        />

        {!isMobile && searchContent}
        <AnimatePresence>
          {isMobile && mobileFilter && (
            <CustomModal onClose={() => setMobileFilter(false)}>
              {filterContent}
            </CustomModal>
          )}

          {!isMobile && filterContent}

          {isMobile && isSearchOpen && (
            <CustomModal onClose={() => setIsSearchOpen(false)}>
              {searchContent}
            </CustomModal>
          )}
        </AnimatePresence>
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <div className=" flex pb-2 ">
          <HorizontalMenu
            tabs={tabs}
            selectedTab={selectedTab}
            setTab={setSelectedTab}
          />
        </div>

        {displayedFavourites && (
          <FavouritesList
            listings={displayedFavourites}
            onClick={() => null}
            toggleLike={handleLikeUpdate}
          />
        )}
        {hasFilter && displayedFavourites.length === 0 && (
          <EmptyState
            title="No matching parcels"
            description="Try adjusting your search or changing filters. Clear filters or search to see all parcels."
          />
        )}
      </DefaultContainer>
    </>
  );
}
