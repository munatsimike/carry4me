type Variant = "trip" | "parcel";

export default function CardLabel({ label, variant }: { variant: Variant; label: string }) {
  const styles: Record<Variant, string> = {
    trip: "bg-primary-50 text-primary-500 border-primary-100 group-hover:bg-white",
    parcel: "bg-purple-50 text-purple-500 border-purple-100 group-hover:bg-white",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-4 h-7 text-sm font-light border rounded-full ${styles[variant]}`}
    >
      {label}
    </span>
  );
}
