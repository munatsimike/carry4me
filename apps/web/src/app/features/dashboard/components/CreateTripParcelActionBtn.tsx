import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";

export default function ActionBtn({
  isSubmitting,
  onCancel,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between px-2 gap-2">
      <Button
        type="button"
        onClick={onCancel}
        className="w-full sm:w-auto"
        variant="neutral"
        size="md"
      >
        <CustomText className="px-6" textVariant="secondary">
          Cancel
        </CustomText>
      </Button>

      <Button
        form="tripForm"
        disabled={isSubmitting}
        type="submit"
        className="w-full sm:w-auto"
        variant="primary"
        size="md"
      >
        <CustomText textVariant="onDark">
          {isSubmitting ? "Posting..." : "Review & Post"}
        </CustomText>
      </Button>
    </div>
  );
}
