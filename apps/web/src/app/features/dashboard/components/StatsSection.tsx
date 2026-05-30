import { Link } from "react-router-dom";
import {
  Clock3,
  ClipboardList,
  Package,
  Plane,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import type { StatsItem } from "../domain/stats.types";

type StatsSectionProps = {
  statsList: StatsItem[];
};

const statIconByName: Record<string, LucideIcon> = {
  "Active Requests": Clock3,
  Deliveries: Truck,
  "Posted Trips": Plane,
  "Posted  Parcels": Package,
  "Posted Parcels": Package,
};

function iconForStat(name: string): LucideIcon {
  return statIconByName[name] ?? ClipboardList;
}

export default function StatsSection({ statsList }: StatsSectionProps) {
  return (
    <div className="flex w-full max-w-full flex-col gap-3 px-2 lg:max-w-sm">
      <CustomText textVariant="primary" textSize="lg" className="font-medium">
        Your stats
      </CustomText>

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative w-full overflow-hidden rounded-3xl bg-primary-100/70 pt-1"
      >
        <div className="rounded-3xl bg-white py-1 shadow-sm px-4">
          <ul className="flex flex-col">
            {statsList.map((item, index) => {
              const Icon = iconForStat(item.itemName);
              const isInteractive = false;

              return (
                <li key={item.itemName}>
                  <Link
                    to={item.link ?? "#"}
                    className={[
                      "flex items-center justify-between gap-3 rounded-2xl px-3 py-3 transition-colors",
                      isInteractive
                        ? "hover:bg-neutral-50"
                        : "hover:bg-neutral-50 cursor-default",
                      index < statsList.length - 1
                        ? "border-b border-neutral-100"
                        : "",
                    ].join(" ")}
                    aria-disabled={!isInteractive}
                    onClick={(e) => {
                      if (!isInteractive) e.preventDefault();
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <CustomText
                        textSize="sm"
                        className="truncate text-neutral-700"
                      >
                        {item.itemName}
                      </CustomText>
                    </span>
                    <CustomText
                      textVariant="label"
                      textSize="md"
                      className="shrink-0  tabular-nums"
                    >
                      {item.count}
                    </CustomText>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
