import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { GoodsItem } from "@/types/Ui";
import GoodsManifestTable, {
  normalizeGoodsItem,
} from "@/app/components/GoodsManifestTable";
import CustomModal from "@/app/components/CustomModal";
import { ModalSeparator } from "@/app/components/ModalFooter";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";

type ParcelSendingRowProps = {
  items: Partial<GoodsItem>[];
};

export default function ParcelSendingRow({ items }: ParcelSendingRowProps) {
  const [showItemsModal, setShowItemsModal] = useState(false);
  const visibleItems = items
    .map(normalizeGoodsItem)
    .filter((item) => item.description.trim());
  const hasItems = visibleItems.length > 0;

  if (!hasItems) return null;

  return (
    <>
      <div className="flex min-w-0 w-full items-start gap-3">
        <CustomText
          as="span"
          textSize="sm"
          textVariant="neutral"
          className="invisible shrink-0 leading-tight"
          aria-hidden
        >
          Sending
        </CustomText>
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setShowItemsModal(true)}
            className={cn(
              "px-2 w-fit text-left text-sm font-medium text-primary-600 underline-offset-2 transition-colors",
              "hover:text-primary-700 hover:underline",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded",
            )}
          >
            View items list
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showItemsModal ? (
          <CustomModal
            width="2xl"
            scrollable
            onClose={() => setShowItemsModal(false)}
          >
            <div className="flex flex-col">
              <CustomText
                as="h2"
                textSize="md"
                textVariant="primary"
                className="pr-8 font-semibold"
              >
                Items list
              </CustomText>
              <ModalSeparator />
              <div className="pt-4">
                <GoodsManifestTable items={visibleItems} hideSizeOnMobile />
              </div>
            </div>
          </CustomModal>
        ) : null}
      </AnimatePresence>
    </>
  );
}
