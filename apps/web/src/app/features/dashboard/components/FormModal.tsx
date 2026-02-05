// resuable container for creating trips and parcels

import CustomModal from "@/app/components/CustomModal";

type FormModalProps = {
  children: React.ReactNode;
  onClose: (v: boolean) => void;
  onSubmit: () => void;
};

export default function FormModal({
  children,
  onClose,
  onSubmit,
}: FormModalProps) {
  const bgColor = "bg-neutral-50";
  return (
    <CustomModal onClose={() => onClose(false)}>
      <form
        id="tripForm"
        onSubmit={onSubmit} // keep your handler too
      >
        <div className={`flex flex-col gap-5 w-full sm:w-2xl px-4`}>
          {children}
        </div>
      </form>
    </CustomModal>
  );
}
