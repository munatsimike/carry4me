import { X } from "lucide-react";

type CloseBackBtnProps = {
  onClose: (b: boolean) => void;
};
export function CloseBackBtn({ onClose }: CloseBackBtnProps) {
  return (
    <div className="absolute top-2 right-2">
      <button
        type="button"
        onClick={() => onClose(false)}
        className="flex items-center justify-center text-neutral-800 hover:text-slate-900 hover:bg-slate-100 transition-all p-1 "
      >
        <X className="h-5 w-5 text-ink-neutral-900" />
      </button>
    </div>
  );
}
