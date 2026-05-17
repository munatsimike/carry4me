import CustomText from "@/components/ui/CustomText";
type Tag = "Traveler" | "Sender";

type UserProps = {
  tag: Tag;
  userName: string;
  avatar: string | null;
};

export default function User({ userName, tag, avatar }: UserProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:pl-8 md:pl-14">
      <img
        src={avatar ? avatar : "/user-profile-icon.svg"}
        className="h-10 w-10 shrink-0 rounded-full border border-neutral-300 sm:h-12 sm:w-12"
        alt=""
      />
      <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
        <CustomText
          textVariant="primary"
          textSize="md"
          className="truncate leading-none font-semimedium"
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
