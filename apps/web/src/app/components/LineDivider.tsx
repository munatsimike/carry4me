export default function LineDivider({
  heightClass = "my-4",
}: {
  heightClass?: string;
}) {
  return (
    <div className={["w-full h-px bg-neutral-50", heightClass].join(" ")} />
  );
}
