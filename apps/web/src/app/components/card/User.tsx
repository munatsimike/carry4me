import CustomText from "@/components/ui/CustomText";
type Tag = "Traveler" | "Sender";

type UserProps = {
  tag: Tag;
  userName: string;
};

export default function User({ userName, tag }: UserProps) {
  return <div className="flex items-center pl-14 gap-3">
    <img
      src="/avatar.svg"
      className="rounded-full h-12 w-12 border border-neutral-50"
    />
    <div className="flex flex-col gap-2">
      <CustomText textVariant="primary" textSize="sm" className="leading-none">
        {userName}
      </CustomText>

      <CustomText textVariant="secondary" textSize="xsm" className="leading-none">
        {tag}
      </CustomText>
    </div>
  </div>;
}
