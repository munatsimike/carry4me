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
    <div className="flex flex-col gap-3">
      <span className="flex items-center gap-4">
        {icon}
        {label}
      </span>
      <span className={className}>{description}</span>
    </div>
  );
}
