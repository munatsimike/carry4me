import { Button, type ButtonVariant } from "@/components/ui/Button";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import SendIcon from "@/assets/send-arrow-icon.svg?react";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";
import { LockKeyholeOpen } from "lucide-react";
import { dialogIconStyle } from "@/app/lib/cn";
import { useAuthModal } from "@/app/shared/Authentication/AuthModalContext";

type SendRequestBtnProps<T> = {
  listingType?: ListingType;
  payLoad: T;
  primaryAction: (payLoad: T) => void;
  secondaryAction?: () => void;
  buttonVariant?: ButtonVariant;
  iconColorVariant?: IconColor;
  buttonTextVariant?: TextVariant;
  isActive?: boolean;
};

export default function SendRequestBtn<T>({
  listingType,
  primaryAction,
  secondaryAction,
  payLoad,
  buttonVariant = "primary",
  buttonTextVariant = "primary",
  iconColorVariant = "onDark",
  isActive = false,
}: SendRequestBtnProps<T>) {
  const { user } = useAuth();
  const { openInfo } = useUniversalModal();
  const { openAuthModal } = useAuthModal();
  const isTripListing = listingType === "trip";
  const base = "flex items-center w-full";
  const alignment = secondaryAction ? "justify-between" : "justify-end";

  return (
    <div className={`${base} ${alignment}`}>
      <Button
        isBusy={isActive}
        onClick={() => {
          if (!user) {
            return openInfo({
              icon: <LockKeyholeOpen className={dialogIconStyle} />,
              label: "Sign in",
              title: "Sign in to continue",
              message: `Please sign in to send a request to this ${isTripListing ? "sender" : "traveler"}.`,
              onClick: () => {
                openAuthModal({
                  mode: "signin",
                  redirectTo: location.pathname,
                });
              },
            });
          }
          primaryAction(payLoad);
        }}
        variant={buttonVariant}
        className="shadow-sm w-full"
        size={"md"}
        leadingIcon={
          <SvgIcon
            size={"sm"}
            Icon={SendIcon}
            color={iconColorVariant}
          ></SvgIcon>
        }
      >
        <CustomText as="span" textSize={"sm"} textVariant={buttonTextVariant}>
          Send request
        </CustomText>
      </Button>
    </div>
  );
}
