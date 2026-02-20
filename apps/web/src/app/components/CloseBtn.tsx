import { X } from "lucide-react";

type CloseBackBtnProps = {
  onClose: (b: boolean) => void;
};
export function CloseBackBtn({ onClose }: CloseBackBtnProps) {
  return (
    <div className="absolute top-3 right-4">
      <button
        type="button"
        onClick={() => onClose(false)}
        className="flex items-center justify-center text-neutral-500 hover:text-slate-900 hover:bg-slate-100 transition-all p-1 rounded-full hover:-translate-y-0.5 bg-neutral-100 "
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}