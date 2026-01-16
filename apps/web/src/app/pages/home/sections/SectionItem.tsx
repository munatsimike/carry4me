type sectionItemProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  description: React.ReactNode;
};

export default function SectionItem({
  icon,
  label,
  description,
}: sectionItemProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex items-center gap-4">
        {icon}
        {label}
      </span>
      <span className="pl-[52px]">{description}</span>
    </div>
  );
}
