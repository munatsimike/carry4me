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
import { CloseBackBtn } from "@/app/components/CloseBtn";

type Mode = "mobile" | "desktop";
type ProfileItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
};

export function UserProfileMenu({
  onClosePopOver,
  triggerRef,
  mode = "mobile",
}: {
  onClosePopOver: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  mode?: Mode;
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
    <>
      {mode === "desktop" ? (
        <DesktopProfileMenu
          profileItems={profileItems}
          onClosePopOver={() => onClosePopOver(false)}
          ref={ref}
        />
      ) : (
        <MobileDrawer
          ref={ref}
          profileItems={profileItems}
          onClose={() => onClosePopOver(false)}
        />
      )}
    </>
  );
}

type UserProfileProps = {
  profileItems: ProfileItem[];
  onClosePopOver: () => void;
  ref: React.RefObject<HTMLDivElement | null>;
};
//show user menu for desktop
function DesktopProfileMenu({
  profileItems,
  onClosePopOver,
  ref,
}: UserProfileProps) {
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
            color={hover ? "primary" : "neutral"}
          />
        </SpaceBetweenRow>
      </motion.span>

      <LineDivider heightClass="my-1" />
    </Link>
  );
}

// mobile menu with secondary actions, my trips, parcels,user profile etc.

function MobileDrawer({
  onClose,
  ref,
  profileItems,
}: {
  onClose: () => void;
  ref: React.RefObject<HTMLDivElement | null>;
  profileItems: ProfileItem[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-40 bg-slate-600/40 justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 right-0 z-50 h-full  w-[70vw] bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 pl-6 pr-3 py-2">
          <CustomText
            textSize="lg"
            textVariant="primary"
            className="font-medium"
          >
            Menu
          </CustomText>
          <CloseBackBtn onClose={onClose} />
        </div>

        <motion.div ref={ref} className="flex flex-col px-4 py-4">
          {profileItems.map((item) => (
            <ProfileItem
              key={item.name}
              profileItem={item}
              onClosePopOver={onClose}
            />
          ))}

          <LogoutButton onClosePopOver={onClose} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
