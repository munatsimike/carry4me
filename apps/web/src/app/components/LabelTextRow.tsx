import CustomText from "@/components/ui/CustomText";

type LabelTextRowProps = {
  label: string;
  text: string | string[];
};

export default function LabelTextRow({ label, text }: LabelTextRowProps) {
  return (
    <span className="flex flex-wrap gap-2 items-center">
      <CustomText
        as="span"
        textSize="xsm"
        textVariant="neutral"
        className="leading-tight"
      >
        {label}
      </CustomText>

      {Array.isArray(text) ? (
        <span className="inline-flex gap-2">
          {text.map((t: string) => (
            <span
              key={t}
              className="inline-flex bg-neutral-50 rounded-full px-2 py-[2px] border border-neutral-200"
            >
              <LabelText text={t} />
            </span>
          ))}
        </span>
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
