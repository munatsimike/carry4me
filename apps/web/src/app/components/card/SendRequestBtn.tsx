import { Button, type ButtonVariant } from "@/components/ui/Button";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import SendIcon from "@/assets/send-arrow-icon.svg?react";
import CustomText, { type TextVariant } from "@/components/ui/CustomText";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import type { ListingType } from "@/app/shared/Authentication/domain/Listing";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import { useNavigate } from "react-router-dom";
import { COMPLETE_PROFILE_PATH } from "@/app/shared/Authentication/domain/profileCompletion";
import { getAccountActionBlockReason } from "@/app/shared/Authentication/domain/accountStatus";
import { useToast } from "@/app/components/Toast";

type SendRequestBtnProps<T> = {
  listingType?: ListingType;
  payLoad: T;
  primaryAction: (payLoad: T) => void;
  buttonVariant?: ButtonVariant;
  iconColorVariant?: IconColor;
  buttonTextVariant?: TextVariant;
  isActive?: boolean;
};

export default function SendRequestBtn<T>({
  listingType,
  primaryAction,
  payLoad,
  buttonVariant = "primary",
  buttonTextVariant = "primary",
  iconColorVariant = "onDark",
  isActive = false,
}: SendRequestBtnProps<T>) {
  const { user, profile, profileIncomplete } = useAuth();
  const { openSignInModal } = useSignInModal();
  const navigate = useNavigate();
  const { toast } = useToast();
  const page = listingType === "trip" ? "/travelers" : "/parcels";
  const base = "flex items-center w-full mb-0";

  return (
    <div className={`${base}`}>
      <Button
        isBusy={isActive}
        onClick={() => {
          if (!user?.id) {
            openSignInModal({ redirectTo: page });
            return;
          }

          if (profileIncomplete) {
            navigate(COMPLETE_PROFILE_PATH);
            return;
          }

          const blockReason = getAccountActionBlockReason(profile, "send_request");
          if (blockReason) {
            toast(blockReason, { variant: "warning" });
            return;
          }

          primaryAction(payLoad);
        }}
        variant={buttonVariant}
        className="shadow-sm w-full"
        size={"sm"}
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
