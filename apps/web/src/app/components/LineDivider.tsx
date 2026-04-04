export default function LineDivider({
  heightClass = "my-4",
  bgColorClass = "bg-slate-100",
}: {
  heightClass?: string;
  bgColorClass?: string;
}) {
  return (
    <div
      className={["w-full h-px", bgColorClass, heightClass].join(" ")}
    />
  );
}
