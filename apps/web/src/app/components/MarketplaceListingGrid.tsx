import type { ReactNode } from "react";

export const marketplaceListingGridClassName =
  "grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3";

type MarketplaceListingGridProps = {
  children: ReactNode;
  className?: string;
};

export default function MarketplaceListingGrid({
  children,
  className,
}: MarketplaceListingGridProps) {
  return (
    <div className={className ? `${marketplaceListingGridClassName} ${className}` : marketplaceListingGridClassName}>
      {children}
    </div>
  );
}
