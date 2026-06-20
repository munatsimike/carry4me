import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import {
  browseMarketplaceButtonClass,
  browseMarketplaceTextClass,
  type BrowseMarketplaceTone,
} from "@/app/shared/marketplace/browseMarketplaceStyles";

export type { BrowseMarketplaceTone };

export const BROWSE_TRIPS_PATH = "/travelers";
export const BROWSE_PARCELS_PATH = "/parcels";

export type BrowseMarketplaceAction = {
  label: string;
  href: string;
  tone: BrowseMarketplaceTone;
};

export {
  browseMarketplaceArrowClass,
  browseMarketplaceButtonClass,
  browseMarketplaceIconClass,
  browseMarketplaceSubtitleClass,
  browseMarketplaceSurfaceClass,
  browseMarketplaceTextClass,
  browseMarketplaceTitleClass,
} from "@/app/shared/marketplace/browseMarketplaceStyles";

export function resolveBrowseMarketplaceTone(
  label: string,
): BrowseMarketplaceTone | null {
  const normalized = label.trim().toLowerCase();
  if (!normalized.startsWith("browse")) return null;
  if (normalized.includes("trip")) return "trips";
  if (normalized.includes("parcel")) return "parcels";
  return null;
}

export function resolveBrowseMarketplaceToneFromPath(
  path: string,
): BrowseMarketplaceTone | null {
  if (path === BROWSE_TRIPS_PATH) return "trips";
  if (path === BROWSE_PARCELS_PATH) return "parcels";
  return null;
}

type BrowseMarketplaceButtonProps = {
  tone: BrowseMarketplaceTone;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  isBusy?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function BrowseMarketplaceButton({
  tone,
  children,
  className,
  size = "sm",
  disabled,
  isBusy,
  onClick,
  type = "button",
}: BrowseMarketplaceButtonProps) {
  return (
    <Button
      type={type}
      variant="ghost"
      size={size}
      disabled={disabled}
      isBusy={isBusy}
      onClick={onClick}
      className={cn(browseMarketplaceButtonClass[tone], className)}
    >
      <CustomText
        as="span"
        textSize={size === "md" ? "sm" : "sm"}
        textVariant="primary"
        className={browseMarketplaceTextClass[tone]}
      >
        {children}
      </CustomText>
    </Button>
  );
}

type BrowseMarketplaceActionsProps = {
  actions: BrowseMarketplaceAction[];
  buttonSize?: "sm" | "md";
};

export default function BrowseMarketplaceActions({
  actions,
  buttonSize = "sm",
}: BrowseMarketplaceActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-around gap-4">
      {actions.map((action) => (
        <Link
          key={`${action.href}-${action.label}`}
          to={action.href}
          className="w-full sm:flex-1"
        >
          <BrowseMarketplaceButton tone={action.tone} size={buttonSize}>
            {action.label}
          </BrowseMarketplaceButton>
        </Link>
      ))}
    </div>
  );
}
