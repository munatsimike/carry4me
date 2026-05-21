import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import Parcels from "./Parcels";
import Search, { SearchResults } from "@/app/components/Search";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import { useToast } from "@/app/components/Toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getTripUseCase } from "@/app/lib/useCases";
import {
  useParcelsList,
  useToggleParcelListLike,
} from "@/app/hooks/queries/useParcelsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import PageSection from "@/app/components/PageSection";
import { AnimatePresence, motion } from "framer-motion";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { FilterOptionsRow } from "@/app/components/FilterOptionsRow";
import ListingSelectionModal from "@/app/components/ListingSelectionModal";
import type { CustomRange, LayoutContext, SortOption } from "@/types/Ui";
import EmptyState from "@/app/components/EmptyState";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import PaginationControls from "@/app/components/PaginationControls";
import CreateParcelModal from "./CreateParcelModal";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import Toolbar from "@/app/components/MobileFilterOptions";
import { useScrollDirection } from "@/app/shared/Authentication/UI/hooks/useScrollDirection";
import { Link, useOutletContext } from "react-router-dom";
import { useFiltersForm } from "@/app/shared/Authentication/UI/hooks/useFiltersForm";
import FAB from "@/app/components/FAB";
import type { ListingPageParams } from "@/types/Pagination";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";

const PAGE_SIZE = 9;

export default function ParcelsPage() {
  const { showSupabaseError } = useUniversalModal();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openSignInModal } = useSignInModal();
  const { guardAction } = useMarketplaceActionGuard();

  const [selectedParcel, setParcel] = useState<ParcelListing | null>(null);
  const [modalState, setModalState] = useState<boolean>(false);
  const { toast } = useToast();
  const [tripSelectionOpen, setTripSelectionOpen] = useState(false);
  // trips to matched with a parcel. when a user selects a parcel they should have a trip.
  const [userTrips, setUserTrips] = useState<TripListing[]>([]);
  // selected parcel to be matched with a trip
  const [selectedTrip, setSelectedTrip] = useState<TripListing | null>(null);
  //store search results and filtered results
  const [searchCountry, setSearchCountry] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [clearSearchResults, setClearResults] = useState<boolean>(false);

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
  const [, setFilterByDate] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption | undefined>();
  const [goodsCategory, setGoodsCategory] = useState<string[]>([]);
  const [parcelModalState, setParcelModalState] = useState<boolean>(false);
  const [page, setPage] = useState(1);

  const listingParams = useMemo<ListingPageParams>(() => ({
    page,
    pageSize: PAGE_SIZE,
    filters: {
      searchCountry,
      searchCity,
      priceRange,
      weightRange,
      goodsCategories: goodsCategory,
      sortOption,
    },
  }), [
    page,
    searchCity,
    searchCountry,
    priceRange,
    weightRange,
    goodsCategory,
    sortOption,
  ]);
  const {
    data: parcelPage,
    isFetched,
    error,
    isFetching,
  } = useParcelsList(user?.id, listingParams);
  useQueryErrorEffect(error);

  const parcelsList = parcelPage?.items ?? [];
  const displayedParcels = parcelsList;
  const totalParcels = parcelPage?.total ?? 0;
  const toggleParcelLike = useToggleParcelListLike(user?.id, listingParams);

  useEffect(() => {
    setPage(1);
  }, [
    searchCity,
    searchCountry,
    priceRange,
    weightRange,
    goodsCategory,
    sortOption,
  ]);
  //
  const handleRequest = async (parcel: ParcelListing) => {
    if (!user) {
      return;
    }

    guardAction(async () => {
    // check if parcel to be matched to a trip does not belong to the logged in user
    if (parcel.user.id === user.id) {
      toast(
        "You can’t match with your own parcel. Browse available trips instead.",
        { variant: "warning" },
      );
      return;
    }

    if (userTrips.length === 0) {
      try {
        const data = await queryClient.fetchQuery({
          queryKey: queryKeys.trips.byUser(user.id),
          queryFn: () => getTripUseCase.execute(user.id),
        });

        if (data.length === 0) {
          toast("Post a trip first to match with a sender.", {
            variant: "warning",
          });
          return;
        }

        if (data.length === 1) {
          setSelectedTrip(data[0]);
        }

        if (data.length > 1) {
          setUserTrips(data);
          setTripSelectionOpen(true);
        }
      } catch (err) {
        showSupabaseError(err);
        return;
      }
    }

    if (userTrips.length > 1 && !tripSelectionOpen) {
      setTripSelectionOpen(true);
    }
    setParcel(parcel);
    setModalState(true);
    }, "send_request");
  };

  const handleLikeUpdate = (id: string) => {
    toggleParcelLike(id);
  };
  const isMobile = useMediaQuery();
  const [mobileFilter, setMobileFilter] = useState<boolean>(false);
  const scrollDirection = useScrollDirection();
  const { isSearchOpen, setIsSearchOpen } = useOutletContext<LayoutContext>();
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
      tag="sender"
      setMobileFilter={() => setMobileFilter(false)}
    />
  );

  const searchContent = (
    <Search
      setSearchCity={setSearchCity}
      setSearchCountry={setSearchCountry}
      setClearResults={() => setClearResults(false)}
      clearResults={clearSearchResults}
    />
  );
  const handleOnClick = () => {
    if (!user?.id) {
      openSignInModal({ redirectTo: "/parcels" });
      return;
    }

    guardAction(() => {
      setParcelModalState(true);
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
      <PageSection align={isMobile ? "left" : "center"}>
        {!isMobile && searchContent}
        <AnimatePresence>
          {isMobile && isSearchOpen && (
            <CustomModal onClose={() => setIsSearchOpen(false)}>
              {searchContent}
            </CustomModal>
          )}

          {isMobile && mobileFilter && (
            <CustomModal onClose={() => setMobileFilter(false)}>
              {filterContent}
            </CustomModal>
          )}
        </AnimatePresence>
        {!isMobile && filterContent}

        <SearchResults
          isSearchActive={isSearchActive}
          searchResults={totalParcels}
          onClick={() => setClearResults(true)}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <AnimatePresence>
          {parcelModalState && (
            <CreateParcelModal
              setModalState={() => setParcelModalState(false)}
            />
          )}
        </AnimatePresence>
        {displayedParcels.length > 0 && (
          <Parcels
            parcels={displayedParcels}
            onClick={handleRequest}
            toggleLike={handleLikeUpdate}
          />
        )}
        {(hasFilter || isSearchActive) && displayedParcels.length === 0 && isFetched && (
          <EmptyState
            title="No matching parcels"
            description="Try adjusting your search or filters to find more parcels."
          />
        )}
        {displayedParcels.length === 0 && isFetched && !hasFilter && !isSearchActive && (
          <EmptyState
            title="No parcels available"
            description="No parcels are available yet. Post a parcel to start receiving trip requests."
            action={
              <Button
                onClick={() => handleOnClick()}
                type={"button"}
                variant="primary"
                size="sm"
                className="w-full mt-1"
              >
                <CustomText textVariant="onDark" textSize="sm">
                  {"Post parcel"}
                </CustomText>
              </Button>
            }
          />
        )}
        {parcelPage && displayedParcels.length > 0 && (
          <PaginationControls
            page={parcelPage.page}
            total={parcelPage.total}
            pageSize={parcelPage.pageSize}
            hasPreviousPage={parcelPage.hasPreviousPage}
            hasNextPage={parcelPage.hasNextPage}
            isFetching={isFetching}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        )}
        <FAB
          isAuthed={!!user?.id}
          variant="parcel"
          to="/create-parcel?mode=create"
        />
      </DefaultContainer>

      <ListingSelectionModal
        listingSelectionOpen={tripSelectionOpen}
        user={user}
        selectedListing={selectedParcel}
        listings={userTrips}
        setListingSelectionOpen={setTripSelectionOpen}
        setSelectedListing={setSelectedTrip}
        setModalState={setModalState}
      />
      <AnimatePresence>
        {selectedParcel && user && selectedTrip && modalState && (
          <CustomModal
            width="xl"
            onClose={() => {
              setModalState(false);
              setSelectedTrip(null);
            }}
          >
            <ConfirmRequest
              loggedInUserId={user.id}
              trip={selectedTrip}
              parcel={selectedParcel}
              onClose={() => {
                setSelectedTrip(null);
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
