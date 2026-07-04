import { Button } from "@/components/ui/Button";

type FormStepActionsProps = {
  primaryLabel?: string;
  onPrimary?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showSubmit?: boolean;
  onCancel?: () => void;
};

export function FormStepActions({
  primaryLabel,
  onPrimary,
  submitLabel,
  isSubmitting,
  showSubmit,
  onCancel,
}: FormStepActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {onCancel ? (
        <Button
          className="w-full flex-1"
          type="button"
          variant="outline"
          onClick={onCancel}
          size="md"
        >
          Cancel
        </Button>
      ) : null}
      {showSubmit ? (
        <Button
          className="w-full flex-1"
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          isBusy={isSubmitting}
          size="md"
        >
          {submitLabel}
        </Button>
      ) : (
        primaryLabel &&
        onPrimary && (
          <Button
            className="w-full flex-1"
            type="button"
            variant="primary"
            onClick={onPrimary}
            size="md"
          >
            {primaryLabel}
          </Button>
        )
      )}
    </div>
  );
}
