import CustomText from "@/components/ui/CustomText";
import CustomModal from "./CustomModal";
import { AnimatePresence } from "framer-motion";
import type { Listing } from "../shared/Authentication/domain/Listing";
import type { User } from "@supabase/supabase-js";
import { MoveRight } from "lucide-react";

interface TripSelectionModalProps<T, U extends Listing> {
  listingSelectionOpen: boolean; // decide when to open the selection modal
  user: User | null;
  selectedListing: T | null; // parcel or trip selected by the user to match with their parcel or trip
  listings: U[]; // list of trips or parcels
  setListingSelectionOpen: (b: boolean) => void; //set  modal to show multiple trips or parcels for the user to choose which one they want to be matched
  setSelectedListing: (listing: U | null) => void;
  setModalState: (b: boolean) => void;
}

export default function ListingSelectionModal<T, U extends Listing>({
  listingSelectionOpen,
  user,
  selectedListing: selectedParcel,
  listings,
  setListingSelectionOpen,
  setSelectedListing,
  setModalState,
}: TripSelectionModalProps<T, U>) {
  return (
    <AnimatePresence>
      {listingSelectionOpen && user && selectedParcel && (
        <CustomModal width="2xl" onClose={() => setListingSelectionOpen(false)}>
          <div className="space-y-4 px-5 py-4">
            <div>
              <CustomText
                textSize="lg"
                textVariant="primary"
                as="h2"
                className="font-medium"
              >
                Select a trip
              </CustomText>
              <CustomText className="mt-1" textVariant="secondary">
                You have multiple active trips. Choose the trip you want to use
                for this request.
              </CustomText>
            </div>

            <div className="space-y-3">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  type="button"
                  onClick={() => {
                    setSelectedListing(listing);
                    setListingSelectionOpen(false);
                    setModalState(true);
                  }}
                  className="w-full transition-all duration-300 rounded-2xl border border-neutral-200  p-2 text-left transition hover:border-primary-300 hover:bg-primary-50 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="flex gap-2 items-center">
                        <CustomText
                          className="font-medium"
                          textSize="md"
                          as="p"
                          textVariant="primary"
                        >
                          {listing.route.originCountry}
                        </CustomText>
                        <MoveRight
                          className="text-neutral-800 h-4 w-4"
                          strokeWidth={1.5}
                        />
                        <CustomText
                          className="font-medium"
                          textSize="md"
                          as="p"
                          textVariant="primary"
                        >
                          {listing.route.destinationCountry}
                        </CustomText>
                      </span>
                      <span className="flex gap-2 items-center">
                        <CustomText as="p" textVariant="label" textSize="xs">
                          Departure
                        </CustomText>
                        <CustomText as="p" textVariant="primary">
                          {listing.route.destinationCity}
                        </CustomText>
                      </span>
                      <span className="flex gap-2 items-center">
                        <CustomText as="p" textVariant="label" textSize="xs">
                          Available space
                        </CustomText>
                        <CustomText as="p" textVariant="primary">
                          {listing.weightKg}kg
                        </CustomText>
                      </span>
                    </div>

                    <span className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-600">
                      Select
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CustomModal>
      )}
    </AnimatePresence>
  );
}
