type Variant = "trip" | "parcel";

export default function CardLabel({ label, variant }: { variant: Variant; label: string }) {
  const styles: Record<Variant, string> = {
    trip: "bg-trip-50 text-trip-500 border-trip-200",
    parcel: "bg-primary-50 text-primary-500 border-primary-300",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-4 h-7 text-sm border rounded-full ${styles[variant]}`}
    >
      {label}
    </span>
  );
}
