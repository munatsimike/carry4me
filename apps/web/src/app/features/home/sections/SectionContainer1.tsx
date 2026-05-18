// Shared layout container for section content (Benefits, Safety, FAQ)

import type { ContainerProps } from "@/types/Ui";

export default function SectionContainer({
  children,
  className,
}: ContainerProps) {
  return (
    <section
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:gap-x-12 lg:gap-x-20 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
