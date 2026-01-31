// Shared layout container for section content (Benefits, Safety, FAQ)

import type { ContainerProps } from "@/types/Ui";

export default function SectionContainer({
  children,
  className,
}: ContainerProps) {
  return (
    <section
      className={`grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-x-20 lg:gap-x-32 ${className}`}
    >
      {children}
    </section>
  );
}
