import CustomModal from "@/app/components/CustomModal";

export default function CreatParcelModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
}) {
  return (
    <CustomModal onClose={() => setShowModal(!showModal)}>
      <div className="flex flex-col gap-4 w-full sm:w-[600px] px-4">
       
      </div>
    </CustomModal>
  );
}