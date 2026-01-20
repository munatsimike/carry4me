import ConfirmRequest from "@/app/components/ConfirmRequest";
import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";
import type { Parcel } from "@/types/Ui";
import { useState } from "react";
import Parcels from "./Parcels";
import { loggedInUserTrip, parlecs } from "../Data";

export default function ParcelsPage() {
  const [selectedParcel, setParcel] = useState<Parcel | null>(null);
  const onClick = (parcel: Parcel) => setParcel(parcel);
  const onClose = () => setParcel(null);

  return (
    <>
      <DefaultContainer>
        <Parcels parcels={parlecs} onClick={onClick} />
      </DefaultContainer>
      {selectedParcel && (
        <CustomModal onClose={onClose}>
          {
            <ConfirmRequest
              trip={loggedInUserTrip}
              parcel={selectedParcel}
              onClose={onClose}
              isSenderRequesting={false}
            />
          }
        </CustomModal>
      )}
    </>
  );
}
