import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Package, Plane } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import CustomText from "@/components/ui/CustomText";
import CustomModal from "@/app/components/CustomModal";
import RequestSummary from "@/app/components/RequestSummary";
import ListingSelectionModal from "@/app/components/ListingSelectionModal";
import { useToast } from "@/app/components/Toast";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";
import { useToggleFavouriteMutation } from "@/app/hooks/mutations/useFavouriteMutations";
import { queryKeys } from "@/app/lib/queryKeys";
import { getParcelUseCase, getTripUseCase } from "@/app/lib/useCases";
import TravelerCard from "@/app/features/trips/ui/TravelerCard";
import ParcelCard from "@/app/features/parcels/ui/ParcelCard";
import type { ParcelListing } from "../../parcels/domain/Parcel";
import type { TripListing } from "../../trips/domain/Trip";
import { cn } from "@/app/lib/cn";

export type SuggestedMatchesData = {
  activeParcels: ParcelListing[];
  activeTrips: TripListing[];
  matchingParcels: ParcelListing[];
  matchingTrips: TripListing[];
  suggestedTrips: TripListing[];
  suggestedParcels: ParcelListing[];
};

type TabId = "trips" | "parcels";

type SuggestedMatchesTabsProps = {
  data: SuggestedMatchesData;
};

const tabMotion = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export default function SuggestedMatchesTabs({ data }: SuggestedMatchesTabsProps) {
  const { user } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const { toast } = useToast();
  const { showSupabaseError } = useUniversalModal();
  const queryClient = useQueryClient();
  const toggleFavourite = useToggleFavouriteMutation();

  const tripCount = data.suggestedTrips.length;
  const parcelCount = data.suggestedParcels.length;
  const hasMatchingListing =
    data.matchingParcels.length > 0 || data.matchingTrips.length > 0;
  const hasMatchingParcels = data.matchingParcels.length > 0;

  const defaultTab: TabId = hasMatchingParcels ? "trips" : "parcels";
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  const [selectedTrip, setSelectedTrip] = useState<TripListing | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelListing | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [parcelSelectionOpen, setParcelSelectionOpen] = useState(false);
  const [tripSelectionOpen, setTripSelectionOpen] = useState(false);
  const [userParcels, setUserParcels] = useState<ParcelListing[]>([]);
  const [userTrips, setUserTrips] = useState<TripListing[]>([]);

  const invalidateSuggestedMatches = () => {
    if (!user?.id) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.suggestedMatches(user.id),
    });
  };

  const handleToggleTripLike = (tripId: string) => {
    if (!user?.id) return;
    toggleFavourite.mutate(
      { userId: user.id, listingId: tripId, listingType: "trip" },
      { onSuccess: invalidateSuggestedMatches },
    );
  };

  const handleToggleParcelLike = (parcelId: string) => {
    if (!user?.id) return;
    toggleFavourite.mutate(
      { userId: user.id, listingId: parcelId, listingType: "parcel" },
      { onSuccess: invalidateSuggestedMatches },
    );
  };

  const handleTripRequest = async (trip: TripListing) => {
    if (!user?.id) return;

    guardAction(async () => {
      if (trip.user.id === user.id) {
        toast(
          "You can’t match with your own trip. Browse available parcels instead.",
          { variant: "warning" },
        );
        return;
      }

      let parcels = [...data.matchingParcels];

      if (parcels.length === 0) {
        try {
          parcels = await queryClient.fetchQuery({
            queryKey: queryKeys.parcels.byUser(user.id),
            queryFn: () => getParcelUseCase.execute(user.id),
          });
        } catch (err) {
          showSupabaseError(err);
          return;
        }
      }

      if (parcels.length === 0) {
        toast("Post a parcel first to match with a traveler.", {
          variant: "warning",
        });
        return;
      }

      setUserParcels(parcels);

      if (parcels.length === 1) {
        setSelectedParcel(parcels[0]);
      }

      if (parcels.length > 1) {
        setParcelSelectionOpen(true);
      }

      setSelectedTrip(trip);
      setRequestModalOpen(true);
    }, "send_request");
  };

  const handleParcelRequest = async (parcel: ParcelListing) => {
    if (!user?.id) return;

    guardAction(async () => {
      if (parcel.user.id === user.id) {
        toast(
          "You can’t match with your own parcel. Browse available trips instead.",
          { variant: "warning" },
        );
        return;
      }

      let trips = [...data.matchingTrips];

      if (trips.length === 0) {
        try {
          trips = await queryClient.fetchQuery({
            queryKey: queryKeys.trips.byUser(user.id),
            queryFn: () => getTripUseCase.execute(user.id),
          });
        } catch (err) {
          showSupabaseError(err);
          return;
        }
      }

      if (trips.length === 0) {
        toast("Post a trip first to match with a sender.", {
          variant: "warning",
        });
        return;
      }

      setUserTrips(trips);

      if (trips.length === 1) {
        setSelectedTrip(trips[0]);
      }

      if (trips.length > 1) {
        setTripSelectionOpen(true);
      }

      setSelectedParcel(parcel);
      setRequestModalOpen(true);
    }, "send_request");
  };

  const closeRequestModal = () => {
    setRequestModalOpen(false);
    setSelectedTrip(null);
    setSelectedParcel(null);
  };

  return (
    <>
      <section className="flex w-full min-w-0 flex-col gap-2">
        <CustomText
          textVariant="primary"
          textSize="lg"
          className="text-left font-medium"
        >
          Suggested matches
        </CustomText>

        <div className="flex w-full min-w-0 flex-col items-center p-3 text-center sm:p-4">
          <div className="flex w-full justify-center">
            <div
              className="inline-flex w-fit gap-1 rounded-lg bg-white p-1"
              role="tablist"
              aria-label="Suggested matches"
            >
              <TabButton
                id="trips"
                label="Trips"
                icon={Plane}
                count={tripCount}
                isActive={activeTab === "trips"}
                onSelect={() => setActiveTab("trips")}
              />
              <TabButton
                id="parcels"
                label="Parcels"
                icon={Package}
                count={parcelCount}
                isActive={activeTab === "parcels"}
                onSelect={() => setActiveTab("parcels")}
              />
            </div>
          </div>

          <div className="mt-2.5 flex min-h-[5.5rem] w-full min-w-0 flex-col items-center">
            <AnimatePresence mode="wait">
              {activeTab === "trips" ? (
                <TabPanel
                  key="trips"
                  panelId="trips"
                  emptyTitle="No matching trips yet."
                  isEmpty={!hasMatchingListing || tripCount === 0}
                  emptyState={
                    !hasMatchingListing ? (
                      <NoActiveListingForMatchesState />
                    ) : undefined
                  }
                >
                  {data.suggestedTrips.map((trip) => (
                    <TravelerCard
                      key={trip.id}
                      trip={trip}
                      onClick={handleTripRequest}
                      setTrips={handleToggleTripLike}
                    />
                  ))}
                </TabPanel>
              ) : (
                <TabPanel
                  key="parcels"
                  panelId="parcels"
                  emptyTitle="No matching parcels yet."
                  isEmpty={!hasMatchingListing || parcelCount === 0}
                  emptyState={
                    !hasMatchingListing ? (
                      <NoActiveListingForMatchesState />
                    ) : undefined
                  }
                >
                  {data.suggestedParcels.map((parcel) => (
                    <ParcelCard
                      key={parcel.id}
                      parcel={parcel}
                      onClick={handleParcelRequest}
                      toggleLike={handleToggleParcelLike}
                    />
                  ))}
                </TabPanel>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <ListingSelectionModal
        listingSelectionOpen={parcelSelectionOpen}
        user={user}
        selectedListing={selectedTrip}
        listings={userParcels}
        setListingSelectionOpen={setParcelSelectionOpen}
        setSelectedListing={setSelectedParcel}
        setModalState={setRequestModalOpen}
      />

      <ListingSelectionModal
        listingSelectionOpen={tripSelectionOpen}
        user={user}
        selectedListing={selectedParcel}
        listings={userTrips}
        setListingSelectionOpen={setTripSelectionOpen}
        setSelectedListing={setSelectedTrip}
        setModalState={setRequestModalOpen}
      />

      <AnimatePresence>
        {selectedTrip && selectedParcel && user && requestModalOpen && (
          <CustomModal
            width="4xl"
            scrollable={false}
            onClose={closeRequestModal}
          >
            <RequestSummary
              loggedInUserId={user.id}
              trip={selectedTrip}
              parcel={selectedParcel}
              onClose={closeRequestModal}
              isSenderRequesting={user.id === selectedParcel.user.id}
            />
          </CustomModal>
        )}
      </AnimatePresence>
    </>
  );
}

function TabButton({
  id,
  label,
  icon: Icon,
  count,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  icon: typeof Plane;
  count: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      onClick={onSelect}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 sm:gap-2 sm:px-3 sm:text-sm",
        isActive
          ? "text-white"
          : "text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-800",
      )}
    >
      {isActive && (
        <motion.span
          layoutId="suggested-matches-tab-indicator"
          className="absolute inset-0 rounded-md bg-primary-500 shadow-sm"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <Icon
        className={cn(
          "relative z-[1] h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4",
          isActive ? "text-white" : "text-neutral-500",
        )}
        strokeWidth={2}
        aria-hidden
      />
      <span className="relative z-[1]">{label}</span>
      <CountBadge count={count} isActive={isActive} />
    </button>
  );
}

function CountBadge({ count, isActive }: { count: number; isActive: boolean }) {
  return (
    <span
      className={cn(
        "relative z-[1] inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1 py-px text-[10px] font-semibold leading-none tabular-nums sm:text-[11px]",
        isActive
          ? "bg-white/25 text-white"
          : "border border-neutral-200/90 bg-white text-neutral-600",
      )}
    >
      {count}
    </span>
  );
}

function TabPanel({
  panelId,
  emptyTitle,
  isEmpty,
  emptyState,
  children,
}: {
  panelId: string;
  emptyTitle: string;
  isEmpty: boolean;
  emptyState?: ReactNode;
  children: ReactNode;
}) {
  if (isEmpty) {
    return (
      <motion.div
        role="tabpanel"
        id={`panel-${panelId}`}
        aria-labelledby={`tab-${panelId}`}
        className="flex w-full min-w-0 flex-col items-center gap-4 py-4"
        {...tabMotion}
      >
        {emptyState ?? <EmptyMatchesState title={emptyTitle} />}
      </motion.div>
    );
  }

  return (
    <motion.div
      role="tabpanel"
      id={`panel-${panelId}`}
      aria-labelledby={`tab-${panelId}`}
      className="flex w-full min-w-0 flex-col items-stretch"
      {...tabMotion}
    >
      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </motion.div>
  );
}

function NoActiveListingForMatchesState() {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <CustomText as="p" textSize="sm" className="font-medium text-neutral-700">
        There are no suggested matches.
      </CustomText>
      <CustomText as="p" textSize="sm" className="text-neutral-500">
        Matches will be shown when you post a trip or parcel.
      </CustomText>
    </div>
  );
}

function EmptyMatchesState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <CustomText as="p" textSize="sm" className="font-medium text-neutral-700">
        {title}
      </CustomText>
      <CustomText as="p" textSize="sm" className="text-neutral-500">
        We&apos;ll notify you when matches appear.
      </CustomText>
    </div>
  );
}
