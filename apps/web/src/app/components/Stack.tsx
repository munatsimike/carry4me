// Vertical layout helper for grouping related UI elements with consistent spacing

export default function Stack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-start gap-3">{children}</div>;
}
