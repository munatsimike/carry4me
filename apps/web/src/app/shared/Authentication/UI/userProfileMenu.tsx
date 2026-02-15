import { Card } from "@/app/components/card/Card";
import LogoutButton from "./LogoutButton";
import LineDivider from "@/app/components/LineDivider";
import CustomText from "@/components/ui/CustomText";
import { Heart, User, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { META_ICONS } from "@/app/icons/MetaIcon";
import SvgIcon from "@/components/ui/SvgIcon";
import SpaceBetweenRow from "@/app/components/SpaceBetweenRow";

type ProfileItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
};

export function UserProfileMenu({
  onCloseProfile,
}: {
  onCloseProfile: () => void;
}) {
  const cls = "h-6 w-6 text-neutral-500";
  const profileItems: ProfileItem[] = [
    { name: "Profile", icon: <UserRound className={cls} />, path: "/profile" },
    {
      name: "My Favourites",
      icon: <Heart className={cls} />,
      path: "/favourites",
    },
  ];
  return (
    <Card
      borderClass="border border-neutral-200"
      shadowClass="shadow-md"
      paddingClass="p-3"
      hover={false}
      className="absolute top-16 right-0 z-10 w-56"
    >
      <div className="flex flex-col">
        {profileItems.map((item) => (
          <ProfileItem key={item.name} profileItem={item} />
        ))}

        <LogoutButton onCloseProfile={onCloseProfile} />
      </div>
    </Card>
  );
}
type ProfileItemProps = {
  profileItem: ProfileItem;
};

function ProfileItem({ profileItem }: ProfileItemProps) {
  return (
    <Link to={profileItem.path ? profileItem.path : "/profile"}>
      <span className="group inline-flex gap-2 items-center p-2 hover:bg-neutral-100 w-full rounded-md">
        {profileItem.icon}
        <SpaceBetweenRow className="items-center w-full">
          <CustomText
            as="span"
            textVariant="primary"
            className={"hover:bg-neutral-100"}
          >
            {profileItem.name}
          </CustomText>
          <SvgIcon size={"xsm"} Icon={META_ICONS.arrowSmall} color="primary" />
        </SpaceBetweenRow>
      </span>

      <LineDivider heightClass="my-1" />
    </Link>
  );
}
