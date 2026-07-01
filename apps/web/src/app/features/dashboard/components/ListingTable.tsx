import CustomText from "@/components/ui/CustomText";
import { AnimatePresence, motion } from "framer-motion";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import { useState } from "react";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import type { FormValues } from "@/types/Ui";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import { toOriginCityFormFields } from "@/app/shared/locations/cityOptions";
import {
  formatListingStatus,
  getListingStatusToggleLabel,
  statusBadgeClass,
} from "@/app/shared/listings/listingStatusPresentation";

// 1) Variants
const tableWrap = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const tbodyVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.05,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export interface ListingTableProps<T extends Listing> {
  data: T[];
  onEdit: (v: FormValues) => void;
  onDelete: (listing: Listing) => void;
  onToggleStatus?: (listing: Listing, active: boolean) => void;
  showDateColumn?: boolean;
  setListingPreview: (p: T) => void;
  setModalState: (b: boolean) => void;
}

export function ListingTable<T extends Listing>({
  data,
  onEdit,
  onDelete,
  onToggleStatus,
  showDateColumn = true,
  setListingPreview,
  setModalState,
}: ListingTableProps<T>) {
  const textStyle = "font-medium text-ink-primary py-4";
  const headerStyle = `pl-4 ${textStyle}`;
  const bodyCellClass = "min-w-0 pl-4 py-3";
  const [hoverId, setHoverId] = useState<string | null>(null);
  const columnCount = showDateColumn ? 6 : 5;

  return (
    <motion.div
      variants={tableWrap}
      initial="hidden"
      animate="show"
      style={{ marginTop: 16 }}
      className="w-full min-w-0 overflow-hidden rounded-xl bg-white shadow-md"
    >
      <div className="w-full min-w-0">
      <table className="w-full min-w-0 border-collapse table-fixed">
        <thead>
          <tr className="text-left border border-b-neutral-200">
            <TableTd
              className={`${showDateColumn ? "w-[32%]" : "w-[38%]"} ${headerStyle}`}
            >
              Route
            </TableTd>
            {showDateColumn ? (
              <TableTd className={`w-[12%] ${headerStyle}`}>Departure</TableTd>
            ) : null}
            <TableTd className={`w-[8%] ${headerStyle}`}>
              Space
            </TableTd>
            <TableTd className={`w-[12%] ${headerStyle}`}>
              Price per kg
            </TableTd>
            <TableTd className={`w-[9%] ${headerStyle}`}>
              Status
            </TableTd>
            <TableTd className={`${showDateColumn ? "w-[27%]" : "w-[33%]"} pl-6 ${textStyle}`}>
              Actions
            </TableTd>
          </tr>
        </thead>

        {/* Animate tbody + rows */}
        <motion.tbody variants={tbodyVariants} initial="hidden" animate="show">
          {data.length === 0 ? (
            <tr>
              <TableTd className="px-4 py-6 text-center text-slate-500" colSpan={columnCount}>
                No listings yet.
              </TableTd>
            </tr>
          ) : null}
          {data.map((row: Listing) => (
            <motion.tr
              key={row.id}
              onMouseEnter={() => setHoverId(row.id)}
              onMouseLeave={() => setHoverId(null)}
              variants={rowVariants}
              whileHover={{ y: -1, scale: 1.002 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="hover:bg-neutral-100 border border-b-neutral-100 hover:shadow-sm"
              style={{ transformOrigin: "center" }}
            >
              <TableTd className={bodyCellClass}>
                <span className="relative inline-flex w-full min-w-0 items-center pr-4">
                  <span
                    className="block min-w-0 truncate text-sm text-ink-primary"
                    title={`${row.route.originCountry} / ${row.route.originCity} → ${row.route.destinationCountry ?? ""} / ${row.route.destinationCity}`}
                  >
                    {`${row.route.originCountry} / ${row.route.originCity} → ${row.route.destinationCountry ?? ""} / ${row.route.destinationCity}`}
                  </span>

                  {/* Preview floats on the right, doesn't affect layout */}
                  <AnimatePresence>
                    {hoverId === row.id && (
                      <motion.button
                        type="button"
                        aria-label="Preview listing"
                        onClick={() => {
                          setListingPreview(row as T);
                        }}
                        initial={{ opacity: 0, x: 6, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 6, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute right-0 inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Preview
                      </motion.button>
                    )}
                  </AnimatePresence>
                </span>
              </TableTd>

              {showDateColumn ? (
                <TableTd className={bodyCellClass}>
                  <span
                    className="block min-w-0 truncate"
                    title={formatListingDate(row.departDate)}
                  >
                    <TableText text={formatListingDate(row.departDate)} />
                  </span>
                </TableTd>
              ) : null}

              <TableTd className={bodyCellClass}>
                <TableText text={`${row.weightKg.toString()}kg`} />
              </TableTd>

              <TableTd className={bodyCellClass}>
                <TableText
                  text={formatCurrencyByCountry(
                    row.route.originCountry,
                    row.pricePerKg,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    },
                  )}
                />
              </TableTd>

              <TableTd className={bodyCellClass}>
                <span className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[12px] ${statusBadgeClass(row.status)}`}>
                  {formatListingStatus(row.status)}
                </span>
              </TableTd>

              <TableTd className={`${bodyCellClass} pl-6`}>
                <div className="flex flex-nowrap items-center gap-1">
                  {(() => {
                    const toggleLabel = getListingStatusToggleLabel(row);
                    return toggleLabel && onToggleStatus ? (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label={`${toggleLabel} listing`}
                        className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs text-primary-700 transition hover:bg-primary-50"
                        onClick={() =>
                          onToggleStatus(row, toggleLabel === "Activate")
                        }
                      >
                        {toggleLabel}
                      </motion.button>
                    ) : null;
                  })()}

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Edit listing"
                    className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs text-ink-primary transition hover:bg-neutral-300"
                    onClick={() => {
                      setModalState(true);
                      // set form values for editing
                      onEdit({
                        id: row.id,
                        originCountry: row.route.originCountry,
                        ...toOriginCityFormFields(
                          row.route.originCity,
                          row.route.originCityIsCustom,
                        ),
                        destinationCountry: row.route.destinationCountry,
                        destinationCity: row.route.destinationCity,
                        goodsCategoryIds: row.goodsCategory.map(
                          (x: GoodsCategory) => x.id,
                        ),
                        itemDescriptions: row.items,
                        weight: row.weightKg,
                        pricePerKg: row.pricePerKg,
                        confirmNoProhibitedItems: false,
                        understandTravelerInspection: false,
                        senderId: row.user.id ?? "",
                        departureDate:
                          row.type === "trip" ? row.departDate : "",
                      });
                    }}
                  >
                    Edit
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Delete listing"
                    className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs text-red-600 transition hover:bg-error-100"
                    onClick={() => onDelete(row)}
                  >
                    Delete
                  </motion.button>
                </div>
              </TableTd>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
      </div>
    </motion.div>
  );
}

function TableTd({
  children,
  className = "pl-4 py-3",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return <td className={className} colSpan={colSpan}>{children}</td>;
}

function TableText({ text }: { text: string }) {
  return (
    <CustomText textVariant="primary" textSize="sm">
      {text}
    </CustomText>
  );
}

function formatListingDate(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) return "—";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw.slice(0, 10);
  }

  const day = parsed.getDate().toString().padStart(2, "0");
  const month = parsed.toLocaleString("en-GB", { month: "short" });
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}
