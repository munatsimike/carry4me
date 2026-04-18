import CustomText from "@/components/ui/CustomText";
type Tag = "Traveler" | "Sender";

type UserProps = {
  tag: Tag;
  userName: string;
  avatar: string | null;
};

export default function User({ userName, tag, avatar }: UserProps) {
  return (
    <div className="flex items-center pl-14 gap-3">
      <img
        src={avatar ? avatar : "/user-profile-icon.svg"}
        className="rounded-full h-12 w-12 border border-neutral-300"
      />
      <div className="flex flex-col gap-2">
        <CustomText
          textVariant="primary"
          textSize="md"
          className="leading-none font-semimedium"
        >
          {userName}
        </CustomText>

        <CustomText
          textVariant="secondary"
          textSize="xs"
          className="leading-none"
        >
          {tag}
        </CustomText>
      </div>
    </div>
  );
}
