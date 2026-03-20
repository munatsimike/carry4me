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
import type { CustomRange, SortOption } from "@/types/Ui";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/app/components/EmptyState";
import { GetFavouritesUseCase } from "../application/GetFavouritesUseCase";
import { SupabaseFavouriteRepository } from "../data/SupabaseFavouriteRepository";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import FavouritesList from "./FavouritesList";
import { SegmentedTabs, type TabItem,  } from "@/app/shared/Authentication/UI/SegmentedTabs";

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
  const [hasFilter, setHasFilter] = useState<boolean>(false);
  const [favListing, setFavListings] = useState<Listing[]>([]);
  const { showSupabaseError } = useUniversalModal();
  const [selectedTab, setSelectedTab] = useState<MyFavTabs>("all");

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

  return (
    <>
      <PageSection>
        <Search
          countries={["UK", "USA"]}
          cities={["London", "Florida"]}
          setSearchCity={setSearchCity}
          setSearchCountry={setSearchCountry}
          setClearResults={() => setClearResults(false)}
          clearResults={clearSearchResults}
        />
        <FilterOptionsRow
          setSelectedDate={setFilterByDate}
          setPriceRange={setPriceRange}
          setWeightRange={setWeightRange}
          setGoodsCategory={setGoodsCategory}
          setSortOption={setSortOption}
          tag="sender"
          setHasFilter={setHasFilter}
        />
        <SegmentedTabs tabs={tabs} selectedTab={selectedTab} setTab={setSelectedTab} />
        <SearchResults
          isSearchActive={isSearchActive}
          searchResults={displayedFavourites.length}
          onClick={() => setClearResults(true)}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
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

