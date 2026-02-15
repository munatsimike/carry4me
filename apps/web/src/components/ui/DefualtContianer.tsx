type ContainerProps = {
  children: React.ReactNode;
  className?: string; // inner container
  outerClassName?: string; // full-width section
};

export default function DefaultContainer({
  children,
  className,
  outerClassName,
}: ContainerProps) {
  return (
    <section className={`${outerClassName} py-5 md:py-5`}>
      <div
        className={`mx-auto max-w-container px-4${
          className ?? ""
        }`}
      >
        {children}
      </div>
    </section>
  );
}