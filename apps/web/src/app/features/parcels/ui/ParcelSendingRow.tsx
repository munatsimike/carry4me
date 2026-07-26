import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { GoodsItem } from "@/types/Ui";
import GoodsManifestTable, {
  normalizeGoodsItem,
} from "@/app/components/GoodsManifestTable";
import CustomModal from "@/app/components/CustomModal";
import { ModalSeparator } from "@/app/components/ModalFooter";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
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
      <button
        type="button"
        onClick={() => setShowItemsModal(true)}
        aria-label="View items list"
        title="View items list"
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full",
          "text-primary-600 transition-colors",
          "hover:bg-primary-50 hover:text-primary-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
        )}
      >
        <SvgIcon size="sm" Icon={META_ICONS.eyeOn} className="text-current" />
      </button>

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
