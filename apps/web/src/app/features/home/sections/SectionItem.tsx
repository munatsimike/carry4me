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
    <div className="flex flex-col sm:gap-2 pb-4">
      <span className="flex items-center gap-4">
        {icon}
        {label}
      </span>
      <span className={className}>{description}</span>
    </div>
  );
}
