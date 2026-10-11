import CustomText from "@/components/ui/CustomText";
import PersonAvatar from "@/app/shared/avatar/PersonAvatar";

type Tag = "Traveler" | "Sender";

type UserProps = {
  tag: Tag;
  userName: string;
  fullName?: string | null;
  avatar: string | null;
};

export default function User({ userName, fullName, tag, avatar }: UserProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:pl-8 md:pl-14">
      <PersonAvatar
        fullName={fullName ?? userName}
        avatarUrl={avatar}
        className="h-10 w-10 text-sm sm:h-12 sm:w-12 sm:text-base"
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
