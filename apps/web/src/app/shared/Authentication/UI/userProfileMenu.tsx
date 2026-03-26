import { Card } from "@/app/components/card/Card";
import LogoutButton from "./LogoutButton";
import LineDivider from "@/app/components/LineDivider";
import CustomText from "@/components/ui/CustomText";
import { Heart, Package, Plane, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { META_ICONS } from "@/app/icons/MetaIcon";
import SvgIcon from "@/components/ui/SvgIcon";
import SpaceBetweenRow from "@/app/components/SpaceBetweenRow";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type ProfileItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
};

export function UserProfileMenu({
  onClosePopOver,
  triggerRef,
}: {
  onClosePopOver: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cls = "h-6 w-6 text-neutral-400";
  const profileItems: ProfileItem[] = [
    {
      name: "Profile",
      icon: <UserRound className={cls} strokeWidth={1.5} />,
      path: "/profile",
    },
    {
      name: "My Favourites",
      icon: <Heart className={cls} strokeWidth={1.5} />,
      path: "/favourites",
    },
    {
      name: "My trips",
      icon: <Plane className={cls} strokeWidth={1.5} />,
      path: "/my/trips",
    },
    {
      name: "My parcels",
      icon: <Package className={cls} strokeWidth={1.5} />,
      path: "/my/parcels",
    },
  ];

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClosePopOver(false);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      const clickedInsidePopover = !!ref.current?.contains(target);
      const clickedTrigger = !!triggerRef.current?.contains(target);

      if (!clickedInsidePopover && !clickedTrigger) {
        onClosePopOver(false);
      }
    }

    function handleScroll(event: Event) {
      if (!ref.current) return;

      if (ref.current.contains(event.target as Node)) return;

      onClosePopOver(false);
    }

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClosePopOver, triggerRef]);
  return (
    <Card
      borderClass="border border-neutral-200"
      shadowClass="shadow-md"
      paddingClass="p-3"
      enableHover={false}
      className="absolute top-full mt-2 right-0 z-10 w-56"
    >
      <motion.div ref={ref} className="flex flex-col ">
        {profileItems.map((item) => (
          <ProfileItem
            key={item.name}
            profileItem={item}
            onClosePopOver={onClosePopOver}
          />
        ))}

        <LogoutButton onClosePopOver={onClosePopOver} />
      </motion.div>
    </Card>
  );
}
type ProfileItemProps = {
  profileItem: ProfileItem;
  onClosePopOver: (b: boolean) => void;
};

function ProfileItem({ profileItem, onClosePopOver }: ProfileItemProps) {
  const [hover, setHover] = useState<boolean>(false);
  const handleHover = () => setHover((v: boolean) => !v);

  return (
    <Link
      onMouseEnter={handleHover}
      onMouseLeave={handleHover}
      onClick={() => onClosePopOver(false)}
      to={profileItem.path ? profileItem.path : "/profile"}
    >
      <motion.span className="group inline-flex gap-2 items-center p-2 hover:bg-neutral-100 w-full rounded-lg">
        {profileItem.icon}
        <SpaceBetweenRow className="items-center w-full">
          <CustomText
            as="span"
            textVariant="primary"
            className={"hover:bg-neutral-100"}
          >
            {profileItem.name}
          </CustomText>
          <SvgIcon
            size={"xs"}
            Icon={META_ICONS.arrowSmall}
            color={hover ? "tonal" : "neutral"}
          />
        </SpaceBetweenRow>
      </motion.span>

      <LineDivider heightClass="my-1" />
    </Link>
  );
}
