import CustomText from "@/components/ui/CustomText";

type LabelTextRowProps = {
  label: string;
  text: string | string[];
};

export default function LabelTextRow({ label, text }: LabelTextRowProps) {
  return (
    <span className="flex gap-3">
  <CustomText
    as="span"
    textSize="xsm"
    textVariant="neutral"
    className="leading-tight"
  >
    {label}
  </CustomText>

  {Array.isArray(text) ? (
    (() => {
      const maxVisible = 3; // change to 2/3/4 depending on your card width
      const visible = text.slice(0, maxVisible);
      const remaining = text.length - visible.length;

      return (
        <span className="flex flex-wrap gap-2 max-w-full overflow-hidden">
          {visible.map((t: string) => (
            <span
              key={t}
              className="inline-flex bg-neutral-100 rounded-full px-2 py-[2px] border border-neutral-200"
            >
              <LabelText text={t} />
            </span>
          ))}

          {remaining > 0 && (
            <span className="inline-flex bg-neutral-200 rounded-full px-2 py-[2px] border border-neutral-300">
              <LabelText text={`+${remaining}`} />
            </span>
          )}
        </span>
      );
    })()
  ) : (
    <LabelText text={text} />
  )}
</span>
  );
}

function LabelText({ text }: { text: string }) {
  return (
    <CustomText
      as="span"
      textVariant="primary"
      textSize="xsm"
      className="leading-tight"
    >
      {text}
    </CustomText>
  );
}
