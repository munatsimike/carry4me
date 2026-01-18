type Tag = "Trip" | "Parcel";

type CardLabelProps = {
  tag: Tag;
};

export default function CardLabel({ tag }: CardLabelProps) {
  const styles: Record<Tag, string> = {
    Trip: "bg-trip-50 text-trip-500 border-trip-200",
    Parcel: "bg-primary-50 text-primary-500 border-primary-300",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-4 h-7 text-sm border rounded-full ${styles[tag]}`}
    >
      {tag}
    </span>
  );
}
