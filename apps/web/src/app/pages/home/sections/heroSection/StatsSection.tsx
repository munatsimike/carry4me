import type {} from "@/types/Ui";
import { StatItem } from "./StatsItem";
import type { InfoItem } from "@/types/Ui";

type StatItemProps = {
  stats: InfoItem[];
};

export default function StatsSection({ stats }: StatItemProps) {
  return (
    <section
      className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-20"
      aria-label="Platform statistics"
    >
      {stats.map((s) => (
        <StatItem key={s.label} stat={s} />
      ))}
    </section>
  );
}
