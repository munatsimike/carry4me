type sectionItemProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  description: React.ReactNode;
  className?: string;
};

export default function SectionItem({
  icon,
  label,
  description,
  className = "pl-[52px]",
}: sectionItemProps) {
  return (
    <div className="flex flex-col gap-1 pb-4 last:pb-0 sm:gap-2">
      <span className="flex min-w-0 items-center gap-4">
        {icon}
        {label}
      </span>
      <span className={className}>{description}</span>
    </div>
  );
}
