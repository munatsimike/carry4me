import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { useEffect, useMemo, useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import RequestSummary from "@/app/components/RequestSummary";
import PageSection from "@/app/components/PageSection";
import Search, { SearchResults } from "@/app/components/Search";
import type { TripListing } from "../domain/Trip";
import { AnimatePresence, motion } from "framer-motion";
import type { ParcelListing } from "../../parcels/domain/Parcel";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import { useToast } from "@/app/components/Toast";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { FilterOptionsRow } from "@/app/components/FilterOptionsRow";
import ListingSelectionModal from "@/app/components/ListingSelectionModal";
import type { CustomRange, LayoutContext, SortOption } from "@/types/Ui";
import EmptyState from "@/app/components/EmptyState";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import PaginationControls from "@/app/components/PaginationControls";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import Toolbar from "@/app/components/MobileFilterOptions";
import { useScrollDirection } from "@/app/shared/Authentication/UI/hooks/useScrollDirection";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useFiltersForm } from "@/app/shared/Authentication/UI/hooks/useFiltersForm";
import FAB from "@/app/components/FAB";
import {
  useToggleTripListLike,
  useTripsList,
} from "@/app/hooks/queries/useTripsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getParcelUseCase } from "@/app/lib/useCases";
import type { ListingPageParams } from "@/types/Pagination";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";

const PAGE_SIZE = 9;

export default function TravelersPage() {
  const { user } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const { openSignInModal } = useSignInModal();
  const { showSupabaseError } = useUniversalModal();
  const queryClient = useQueryClient();

  const [selectedTrip, setTrip] = useState<TripListing | null>(null);
  const [parcels, setParcel] = useState<ParcelListing[]>([]);
  const [modalState, setModalState] = useState<boolean>(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelListing | null>(
    null,
  );
  const [parcelSelectionOpen, setParcelSelectionOpen] =
    useState<boolean>(false);
  const { toast } = useToast();
  const [searchCountry, setSearchCountry] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const country = searchCountry.toLowerCase().trim();
  const [clearSearchResults, setClearResults] = useState<boolean>(false);
  const city = searchCity.toLowerCase().trim();
  const isSearchActive = !!country && !!city;
  const [goodsCategory, setGoodsCategory] = useState<string[]>([]);

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
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const listingParams = useMemo<ListingPageParams>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      filters: {
        searchCountry,
        searchCity,
        departDate: filterByDate,
        priceRange,
        weightRange,
        goodsCategories: goodsCategory,
        sortOption,
      },
    }),
    [
      page,
      searchCity,
      searchCountry,
      filterByDate,
      priceRange,
      weightRange,
      goodsCategory,
      sortOption,
    ],
  );

  const {
    data: tripPage,
    isFetched,
    error,
    isFetching,
  } = useTripsList(user?.id, listingParams);
  useQueryErrorEffect(error);

  const tripList = tripPage?.items ?? [];
  const displayedTrips = tripList;
  const totalTrips = tripPage?.total ?? 0;
  const toggleTripLike = useToggleTripListLike(user?.id, listingParams);

  useEffect(() => {
    setPage(1);
  }, [
    searchCity,
    searchCountry,
    filterByDate,
    priceRange,
    weightRange,
    goodsCategory,
    sortOption,
  ]);

  const handleRequest = async (trip: TripListing) => {
    if (!user?.id) {
      return;
    }

    guardAction(async () => {
      if (trip.user.id === user?.id) {
        toast(
          "You can’t match with your own trip. Browse available parcels instead.",
          {
            variant: "warning",
          },
        );
        return;
      }

      if (parcels.length === 0) {
        try {
          const data = await queryClient.fetchQuery({
            queryKey: queryKeys.parcels.byUser(user.id),
            queryFn: () => getParcelUseCase.execute(user.id),
          });

          if (data.length === 0) {
            toast("Post a parcel first to match with a traveler.", {
              variant: "warning",
            });
            return;
          }

          if (data.length === 1) {
            setSelectedParcel(data[0]);
          }

          if (data.length > 1) {
            setParcel(data);
            setParcelSelectionOpen(true);
          }
        } catch (err) {
          showSupabaseError(err);
          return;
        }
      }

      if (parcels.length > 1 && !parcelSelectionOpen) {
        setParcelSelectionOpen(true);
      }

      setTrip(trip);
      setModalState(true);
    }, "send_request");
  };

  const handleLikeUpdate = (id: string) => {
    toggleTripLike(id);
  };

  const [mobileFilter, setMobileFilter] = useState<boolean>(false);
  const { isSearchOpen, setIsSearchOpen } = useOutletContext<LayoutContext>();
  const isMobile = useMediaQuery();
  const scrollDirection = useScrollDirection();
  const filterForm = useFiltersForm({
    setSelectedDate: setFilterByDate,
    setPriceRange,
    setWeightRange,
    setGoodsCategory,
    setSortOption,
  });

  const { clearFilters, hasFilter } = filterForm;

  const filterContent = (
    <FilterOptionsRow
      filterForm={filterForm}
      setMobileFilter={() => setMobileFilter(false)}
    />
  );

  const searchContent = (
    <Search
      setSearchCountry={setSearchCountry}
      setSearchCity={setSearchCity}
      setClearResults={() => setClearResults(false)}
      clearResults={clearSearchResults}
    />
  );

  const handleOnClick = () => {
    if (!user?.id) {
      openSignInModal({ redirectTo: "/travelers" });
      return;
    }

    guardAction(() => {
      navigate("/create-trip?mode=create&returnTo=/travelers");
    });
  };

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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
        <SearchResults
          isSearchActive={isSearchActive}
          searchResults={totalTrips}
          onClick={() => setClearResults(true)}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {displayedTrips.length === 0 &&
          isFetched &&
          !hasFilter &&
          !isSearchActive && (
            <EmptyState
              title="No trips available"
              description="No trips are available yet. Post your trip to start receiving parcel requests."
              action={
                <Button
                  onClick={() => handleOnClick()}
                  type="button"
                  variant="primary"
                  size="sm"
                  className="w-full mt-1"
                >
                  <CustomText textVariant="onDark" textSize="sm">
                    {"Post trip"}
                  </CustomText>
                </Button>
              }
            />
          )}

        {displayedTrips.length > 0 && (
          <Travelers
            trips={displayedTrips}
            onClick={handleRequest}
            onToggleLikd={handleLikeUpdate}
          />
        )}

        {(hasFilter || isSearchActive) &&
          displayedTrips.length === 0 &&
          isFetched && (
            <EmptyState
              title="No matching travelers"
              description="Try adjusting your search or filters to find more travelers."
            />
          )}

        {tripPage && displayedTrips.length > 0 && (
          <PaginationControls
            page={tripPage.page}
            total={tripPage.total}
            pageSize={tripPage.pageSize}
            hasPreviousPage={tripPage.hasPreviousPage}
            hasNextPage={tripPage.hasNextPage}
            isFetching={isFetching}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        )}

        <FAB
          isAuthed={!!user?.id}
          variant="trip"
          to="/create-trip?mode=create&returnTo=/travelers"
        />
      </DefaultContainer>

      <ListingSelectionModal
        listingSelectionOpen={parcelSelectionOpen}
        user={user}
        selectedListing={selectedTrip}
        listings={parcels}
        setListingSelectionOpen={setParcelSelectionOpen}
        setSelectedListing={setSelectedParcel}
        setModalState={setModalState}
      />
      <AnimatePresence>
        {selectedTrip && selectedParcel && user && modalState && (
          <CustomModal
            width="4xl"
            scrollable={false}
            onClose={() => {
              setSelectedParcel(null);
              setModalState(false);
            }}
          >
            <RequestSummary
              loggedInUserId={user.id}
              trip={selectedTrip}
              parcel={selectedParcel}
              onClose={() => {
                setSelectedParcel(null);
                setModalState(false);
              }}
              isSenderRequesting={user.id === selectedParcel.user.id}
            />
          </CustomModal>
        )}
      </AnimatePresence>
    </>
  );
}
