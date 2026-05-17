import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";

type PaginationControlsProps = {
  page: number;
  total: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isFetching?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export default function PaginationControls({
  page,
  total,
  pageSize,
  hasPreviousPage,
  hasNextPage,
  isFetching = false,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  if (total <= pageSize && !hasPreviousPage && !hasNextPage) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasPreviousPage || isFetching}
        isBusy={isFetching}
        onClick={onPrevious}
      >
        Previous
      </Button>
      <CustomText textVariant="secondary" textSize="sm">
        Page {page} of {totalPages}
      </CustomText>
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={!hasNextPage || isFetching}
        isBusy={isFetching}
        onClick={onNext}
      >
        Next
      </Button>
    </div>
  );
}
