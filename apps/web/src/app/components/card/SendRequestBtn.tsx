import { Button, type ButtonVariant } from "@/components/ui/Button";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";

type SendRequestBtnProps<T> = {
  listingType?: ListingType;
  payLoad: T;
  primaryAction: (payLoad: T) => void;
  buttonVariant?: ButtonVariant;
  buttonTextVariant?: TextVariant;
  isActive?: boolean;
  disabled?: boolean;
};

export default function SendRequestBtn<T>({
  listingType,
  primaryAction,
  payLoad,
  buttonVariant = "primary",
  buttonTextVariant = "primary",
  isActive = false,
  disabled = false,
}: SendRequestBtnProps<T>) {
  const { user } = useAuth();
  const { openSignInModal } = useSignInModal();
  const { guardAction } = useMarketplaceActionGuard();
  const page = listingType === "trip" ? "/travelers" : "/parcels";
  const base = "flex items-center w-full mb-0";

  return (
    <div className={`${base}`}>
      <Button
        isBusy={isActive}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!user?.id) {
            openSignInModal({ redirectTo: page });
            return;
          }

          guardAction(() => {
            primaryAction(payLoad);
          }, "send_request");
        }}
        variant={buttonVariant}
        className={`shadow-sm w-full ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
        size={"sm"}
      >
        <CustomText as="span" textSize={"sm"} textVariant={buttonTextVariant}>
          Send request
        </CustomText>
      </Button>
    </div>
  );
}
