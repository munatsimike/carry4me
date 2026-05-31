import CustomText from "@/components/ui/CustomText";
import { AnimatePresence, motion } from "framer-motion";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import { useState } from "react";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import type { FormValues } from "@/types/Ui";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import { toOriginCityFormFields } from "@/app/shared/locations/cityOptions";

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
  onDelete: (s: string) => void;
  setListingPreview: (p: T) => void;
  setModalState: (b: boolean) => void;
}

export function ListingTable<T extends Listing>({
  data,
  onEdit,
  onDelete,
  setListingPreview,
  setModalState,
}: ListingTableProps<T>) {
  const textStyle = "font-medium text-ink-primary py-4";
  const headerStyle = `pl-4 ${textStyle}`;
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <motion.div
      variants={tableWrap}
      initial="hidden"
      animate="show"
      style={{ marginTop: 16 }}
      className="bg-white shadow-md rounded-xl"
    >
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="text-left border border-b-neutral-200">
            <TableTd className={`w-[38%] ${headerStyle}`}>Route</TableTd>
            <TableTd className={`w-[14%] ${headerStyle}`}>Date</TableTd>
            <TableTd className={`w-[10%] ${headerStyle}`}>Space</TableTd>
            <TableTd className={`w-[14%] ${headerStyle}`}>Price per kg</TableTd>
            <TableTd className={`w-[10%] ${headerStyle}`}>Status</TableTd>
            <TableTd className={`w-[14%] pl-6 ${textStyle}`}>Actions</TableTd>
          </tr>
        </thead>

        {/* Animate tbody + rows */}
        <motion.tbody variants={tbodyVariants} initial="hidden" animate="show">
          {data.length === 0 ? (
            <tr>
              <TableTd className="px-4 py-6 text-center text-slate-500" colSpan={6}>
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
              <TableTd className="pl-4 py-2 w-[38%]">
                <span className="relative inline-flex items-center w-full max-w-lg pr-4">
                  {/* Left text stays stable */}
                  <span className="inline-flex gap-2 min-w-0">
                    <TableText
                      text={`${row.route.originCountry} / ${row.route.originCity} → `}
                    />
                    <TableText
                      text={`${row.route.destinationCountry ?? ""} / ${row.route.destinationCity}`}
                    />
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

              <TableTd className="pl-4 py-2 w-[14%] whitespace-nowrap">
                <TableText
                  text={row.type === "trip" ? formatListingDate(row.departDate) : "—"}
                />
              </TableTd>

              <TableTd>
                <TableText text={`${row.weightKg.toString()}kg`} />
              </TableTd>

              <TableTd>
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

              <TableTd>
                <span className={`inline-flex rounded-full border px-2 py-1 text-[12px] ${statusBadgeClass(row.status)}`}>
                  {formatListingStatus(row.status)}
                </span>
              </TableTd>

              <TableTd>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Edit listing"
                    className="rounded-md px-3 py-1 text-sm text-ink-primary transition hover:bg-neutral-300"
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
                    className="rounded-md px-2 py-1 text-sm text-red-600 transition hover:bg-error-100"
                    onClick={() => onDelete(row.id)}
                  >
                    Delete
                  </motion.button>
                </div>
              </TableTd>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </motion.div>
  );
}

function TableTd({
  children,
  className = "pl-4 py-2",
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

function formatListingStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function statusBadgeClass(status: string): string {
  const normalized = status.trim().toUpperCase();

  if (normalized === "ACTIVE" || normalized === "OPEN") {
    return "bg-success-50 text-success-500 border-success-200";
  }

  if (normalized === "FULL" || normalized === "MATCHED") {
    return "bg-primary-50 text-primary-500 border-primary-200";
  }

  if (normalized === "ARCHIVED") {
    return "bg-neutral-100 text-neutral-500 border-neutral-200";
  }

  return "bg-neutral-100 text-neutral-600 border-neutral-200";
}
