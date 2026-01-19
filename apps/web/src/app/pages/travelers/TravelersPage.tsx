import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { travelers, myParcel } from "../Data";
import type { Trip } from "@/types/Ui";
import { useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";

export default function TravelersPage() {
  const [selectedTrip, setTrip] = useState<Trip | null>(null);
  const onclick = (trip: Trip) => setTrip(trip);
  const onClose = () => setTrip(null);
  return (
    <>
      <DefaultContainer>
        <Travelers trips={travelers} onClick={onclick} />
      </DefaultContainer>
      {selectedTrip && (
        <CustomModal onClose={onClose}>
          {<ConfirmRequest trip={selectedTrip} parcel={myParcel} onClose={onClose}/>}
        </CustomModal>
      )}
    </>
  );
}
