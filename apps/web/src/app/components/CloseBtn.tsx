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
        className="flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all p-1 rounded-md hover:-translate-y-0.5"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}