type SpinnerProps = {
  size?: "inline" | "page";
};

export default function Spinner({ size = "inline" }: SpinnerProps) {
  const sizeClass =
    size === "page"
      ? "h-5 w-5 border-2 sm:h-6 sm:w-6"
      : "h-4 w-4 border-2";

  return (
    <span
      className={`inline-block animate-spin rounded-full border-primary-400 border-t-transparent ${sizeClass}`}
    />
  );
}
