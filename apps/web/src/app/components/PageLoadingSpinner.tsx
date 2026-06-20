import Spinner from "@/app/components/Spinner";

export default function PageLoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[160px] w-full items-center justify-center py-8 sm:min-h-[240px] sm:py-12"
    >
      <Spinner size="page" />
    </div>
  );
}
