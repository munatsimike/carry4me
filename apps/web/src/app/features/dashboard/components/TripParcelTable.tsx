import CustomText from "@/components/ui/CustomText";
import { AnimatePresence, motion } from "framer-motion";
import type { TableRow } from "../../trips/application/TripByIdUseCase";
import type { FormValues } from "../CreateParcelModal";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import type { Parcel } from "../../parcels/domain/Parcel";
import {useState } from "react";

// 1) Variants
const tableWrap = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
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
    transition: { duration: 0.22, ease: "easeOut" },
  },
};

type TableProps = {
  data: TableRow[];
  onEdit: (b: boolean) => void;
  onDelete: (s: string) => void;
  setFormValues: (v: FormValues) => void;
  onClick: () => void;
  setParcel: (p: Parcel) => void;
};

export function TripParcelTable({
  data,
  onEdit,
  onDelete,
  setFormValues,
  onClick,
  setParcel,
}: TableProps) {
  const headerStyle = "pl-4 py-4 font-medium";

  const [hoverId, sethover] = useState<string | null>(null);

  const previewParcel = (row: TableRow) => {
    // set parcel for preview
    setParcel({
      id: row.id,
      user: {
        fullName: row.user.fullName,
        avatarUrl: row.user.avatarUrl,
        id: null,
        countryCode: null,
        city: null,
        phoneNumber: null,
      },
      categories: row.goodsCategory,
      route: {
        originCountry: row.originCountry,
        originCity: row.originCity,
        destinationCountry: row.destinationCountry,
        destinationCity: row.destinationCity,
      },
      weightKg: 0,
      items: [],
      pricePerKg: 0,
    });
    onClick();
  };

  return (
    <motion.div
      variants={tableWrap}
      initial="hidden"
      animate="show"
      style={{ marginTop: 16 }}
      className="bg-white shadow-md rounded-xl"
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr className="text-left border border-b-neutral-200">
            <TableTd className={headerStyle}>Route</TableTd>
            <TableTd className={headerStyle}>Date</TableTd>
            <TableTd className={headerStyle}>Space</TableTd>
            <TableTd className={headerStyle}>Price/kg</TableTd>
            <TableTd className={headerStyle}>Status</TableTd>
            <TableTd className="pl-6 py-4 font-medium">Actions</TableTd>
          </tr>
        </thead>

        {/* Animate tbody + rows */}
        <motion.tbody variants={tbodyVariants} initial="hidden" animate="show">
          {data.map((row: TableRow) => (
            <motion.tr
              key={row.id}
              onMouseEnter={() => sethover(row.id)}
              onMouseLeave={() => sethover(null)}
              variants={rowVariants}
              whileHover={{ y: -1, scale: 1.002 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="hover:bg-neutral-100 border border-b-neutral-100 hover:shadow-sm"
              style={{ transformOrigin: "center" }}
            >
              <TableTd>
                <span className="relative inline-flex items-center w-full max-w-lg pr-4">
                  {/* Left text stays stable */}
                  <span className="inline-flex gap-2 min-w-0">
                    <TableText
                      text={`${row.originCountry} / ${row.originCity} → `}
                    />
                    <TableText
                      text={`${row.destinationCountry ?? ""} / ${row.destinationCity}`}
                    />
                  </span>

                  {/* Preview floats on the right, doesn't affect layout */}
                  <AnimatePresence>
                    {hoverId === row.id && (
                      <motion.button
                        type="button"
                        onClick={() => previewParcel(row)}
                        initial={{ opacity: 0, x: 6, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 6, scale: 0.98 }}
                        transition={{ duration: 0.40, ease: "easeOut" }}
                        className="absolute right-0 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Preview
                      </motion.button>
                    )}
                  </AnimatePresence>
                </span>
              </TableTd>

              <TableTd>
                <TableText text={row.departDate.slice(0, 10)} />
              </TableTd>

              <TableTd>
                <TableText text={`${row.capacityKg.toString()} kg`} />
              </TableTd>

              <TableTd>
                <TableText text={row.pricePerKg.toString()} />
              </TableTd>

              <TableTd>
                <span className="iniline-flex rounded-full bg-success-50 px-2 py-1 text-success-500 border border-success-100 text-sm">
                  Active
                </span>
                <TableText text={row.status} />
              </TableTd>

              <TableTd>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="hover:bg-neutral-300 px-3 rounded-md py-1"
                    onClick={() => {
                      onEdit(true);
                      // set form values for editing
                      setFormValues({
                        id: row.id,
                        originCountry: row.originCountry,
                        originCity: row.originCity,
                        destinationCountry: "Zimbabwe",
                        destinationCity: "Harare",
                        goodsCategoryIds: row.goodsCategory.map(
                          (x: GoodsCategory) => x.id,
                        ),
                        itemDescriptions: row.itemDescription,
                        totalWeight: row.capacityKg,
                        pricePerKg: row.pricePerKg,
                        agreeToRules: false,
                        sender_id: row.user.id,
                      });
                    }}
                  >
                    Edit
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="hover:bg-error-100 px-2 rounded-md py-1"
                    onClick={() => onDelete(row.id)}
                    style={{ color: "crimson" }}
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={className}>{children}</td>;
}

function TableText({ text }: { text: string }) {
  return (
    <CustomText textVariant="primary" textSize="sm">
      {text}
    </CustomText>
  );
}
