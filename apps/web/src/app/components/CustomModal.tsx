type ModalProps = {
  children: React.ReactNode;
  onClose?: () => void;
};

export default function CustomModal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative rounded-xl bg-white p-8 shadow-lg">
          {children}
        </div>
      </div>
  );
}
