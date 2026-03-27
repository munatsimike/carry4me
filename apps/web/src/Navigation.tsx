import { NavLink, useLocation } from "react-router-dom";
import { useAuthModal } from "./app/shared/Authentication/AuthModalContext";
import {
  Bell,
  BellRing,
  Handshake,
  HomeIcon,
  LayoutDashboard,
  Menu,
  Package,
  Search,
  Plane,
  UserPlus,
} from "lucide-react";
import type { UserProfile } from "./app/shared/Authentication/domain/authTypes";
import { useEffect, useMemo, useRef, useState } from "react";
import { SupabaseNotificationRepository } from "./app/features/carry request/carry request events/data/SupabaseNotificationRepository";
import { GetNotificationUseCase } from "./app/features/carry request/carry request events/application/CreateNotificationUseCase";
import { namedCall } from "./app/shared/Authentication/application/NamedCall";
import { useToast } from "./app/components/Toast";
import type { CarryRequestNotification } from "./app/features/carry request/carry request events/domain/CarryRequestNotification";
import { AnimatePresence, motion } from "framer-motion";
import { UserProfileMenu } from "./app/shared/Authentication/UI/userProfileMenu";
import NotificationPopover from "./app/shared/Authentication/UI/NotificationPopOver";

import CustomText from "./components/ui/CustomText";

import SearchComponent from "./app/components/Search";
import CustomModal from "./app/components/CustomModal";
import { CloseBackBtn } from "./app/components/CloseBtn";

const iconStyle = "h-5 w-5 text-neutral-500 md:hidden";
const strokeWidth = 1.5;

type ProfileProps = {
  userProfile: UserProfile | null;
};

type NavigationProps = {
  userLoggedIn: boolean;
  userProfile: UserProfile | null;
};

export default function DesktopNavigationMenu({
  userLoggedIn,
  userProfile,
}: NavigationProps) {
  if (!userLoggedIn) {
    return <GuestNavigation />;
  }
  return userLoggedIn ? (
    <AuthenticatedNavigation userProfile={userProfile} />
  ) : (
    <GuestNavigation />
  );
}

function NavLinks({ children }: { children: React.ReactNode }) {
  return (
    <nav className="relative flex flex-col sm:items-center  px-2 sm:px-5 sm:py-1 sm:flex-row gap-5 text-sm sm:justify-center">
      {children}
    </nav>
  );
}

function GuestNavigation() {
  const { openAuthModal } = useAuthModal();
  const location = useLocation();

  return (
    <NavLinks>
      <Home />
      <NavItem to="/travelers">
        {" "}
        <Plane className={iconStyle} strokeWidth={strokeWidth} />
        Trips
      </NavItem>
      <NavItem to="/parcels">
        {" "}
        <Package className={iconStyle} strokeWidth={strokeWidth} />
        Parcels
      </NavItem>
      <NavItem to="signup">
        <UserPlus className={iconStyle} strokeWidth={strokeWidth} />
        <button className="text-sm font-medium text-gray-700 hover:text-blue-600">
          Sign up
        </button>
      </NavItem>
      <button
        onClick={() =>
          openAuthModal({
            mode: "signin",
            redirectTo: location.pathname,
          })
        }
        className="rounded-full whitespace-nowrap bg-blue-500 px-4 py-1.5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600"
      >
        Sign in
      </button>
    </NavLinks>
  );
}

function AuthenticatedNavigation({ userProfile }: ProfileProps) {
  const notificatoinRepo = useMemo(
    () => new SupabaseNotificationRepository(),
    [],
  );
  const getNotificationUseCase = useMemo(
    () => new GetNotificationUseCase(notificatoinRepo),
    [notificatoinRepo],
  );
  const [notifications, setNotifications] = useState<
    CarryRequestNotification[]
  >([]);

  const [showNotificationPopOver, setShowNotification] =
    useState<boolean>(false);
  const [showPopOver, setShowPrfilePopOver] = useState(false);

  const [unreadNotifications, setUnreadNotification] = useState<
    CarryRequestNotification[]
  >([]);
  const { toast } = useToast();
  const triggerNotRef = useRef<HTMLButtonElement | null>(null);
  const triggerProfRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    async function markAllAsRead() {
      if (!userProfile?.id) return;
      if (unreadNotifications.length > 0 && showNotificationPopOver) {
        const { result } = await namedCall(
          "mark notification as read",
          getNotificationUseCase.makeAllAsRead(userProfile?.id),
        );
        if (!result.success) {
          return;
        }

        if (result.success) {
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
          );
          setUnreadNotification([]);
        }
      }
    }

    markAllAsRead();
  }, [showNotificationPopOver]);

  useEffect(() => {
    async function fetchNotification() {
      if (!userProfile?.id) return;
      const { result } = await namedCall(
        "get notifications",
        getNotificationUseCase.execute(userProfile?.id),
      );

      if (!result.success) {
        toast("unable to load notifications at the moment", {
          variant: "error",
        });
      }

      if (result.success) {
        setNotifications(result.data);
        if (result.data.length > 0) {
          const unreadNot = result.data.filter((item) => item.readAt === null);
          setUnreadNotification(unreadNot);
        }
      }
    }
    fetchNotification();
  }, [userProfile?.id]);

  return (
    <NavLinks>
      <NavItem to="/dashboard">
        {" "}
        <LayoutDashboard className={iconStyle} strokeWidth={strokeWidth} />
        Dashboard
      </NavItem>
      <NavItem to="/travelers">
        {" "}
        <Plane className={iconStyle} strokeWidth={strokeWidth} />
        Trips
      </NavItem>
      <NavItem to="/parcels">
        {" "}
        <Package className={iconStyle} strokeWidth={strokeWidth} />
        Parcels
      </NavItem>
      <NavItem to="/requests">
        {" "}
        <Handshake className={iconStyle} strokeWidth={strokeWidth} />
        Requests
      </NavItem>
      <button
        ref={triggerNotRef}
        type="button"
        onClick={() => setShowNotification((prev) => !prev)}
      >
        <span className=" group inline-flex gap-1 items-center hover:text-primary-600">
          <span className="relative flex rounded-full p-1 group-hover:bg-neutral-200">
            {unreadNotifications.length > 0 ? (
              <motion.span
                animate={
                  unreadNotifications.length > 0
                    ? { rotate: [0, -8, 8, -6, 6, 0] }
                    : { rotate: 0 }
                }
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                }}
                style={{
                  display: "inline-flex",
                  transformOrigin: "top center",
                }}
              >
                {unreadNotifications.length > 0 ? (
                  <BellRing
                    className="h-6 w-6 text-neutral-600"
                    strokeWidth={1.5}
                  />
                ) : (
                  <Bell
                    className="h-6 w-6 text-neutral-600"
                    strokeWidth={1.5}
                  />
                )}
              </motion.span>
            ) : (
              <Bell className="h-6 w-6 text-neutral-600" strokeWidth={1.5} />
            )}
            {unreadNotifications.length > 0 && (
              <span className="flex absolute z-10 right-0 top-[-1px] rounded-full h-4 w-4 bg-error-500 text-[11px] text-white justify-center items-center">
                {unreadNotifications.length}
              </span>
            )}
          </span>
        </span>
      </button>
      <AnimatePresence>
        {showNotificationPopOver && (
          <NotificationPopover
            notifications={notifications}
            onClosePopOver={setShowNotification}
            triggerRef={triggerNotRef}
          />
        )}
      </AnimatePresence>

      <span className="relative inline-flex flex-col">
        <button
          ref={triggerProfRef}
          type="button"
          onClick={() => setShowPrfilePopOver((prev) => !prev)}
        >
          <img
            src={
              userProfile?.avatarUrl
                ? userProfile.avatarUrl
                : "/user-profile-icon.svg"
            }
            alt="User profile"
            className="rounded-full h-9 w-9 border border-neutral-300"
          />
        </button>
        <AnimatePresence>
          {showPopOver && (
            <UserProfileMenu
              onClosePopOver={setShowPrfilePopOver}
              triggerRef={triggerProfRef}
            />
          )}
        </AnimatePresence>
      </span>
    </NavLinks>
  );
}

function Home() {
  return (
    <NavItem to="/" end={true}>
      <HomeIcon className={iconStyle} strokeWidth={strokeWidth} />
      Home
    </NavItem>
  );
}

type NavItemProps = {
  end?: boolean;
  to: string;
  children: React.ReactNode;
};

function NavItem({ to, children, end = false }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative w-full whitespace-nowrap ${
          isActive
            ? "text-primary-600 font-medium"
            : "text-neutral-800 hover:text-primary-600"
        }`
      }
      end={end}
    >
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </NavLink>
  );
}

export function MobileNavigationMenu({
  isAuthed,
  profile,
  setIsSearchOpen
}: {
  isAuthed: boolean;
  profile: UserProfile | null;
  setIsSearchOpen:()=>void
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const location = useLocation();
  const style =
    "flex flex-col text-ink-primary items-center justify-center gap-0.5 text-[12px] flex-1 py-1";
  const iconColor = "text-neutral-500";

  return (
    <>
      <div className="relative flex md:hidden items-center justify-between w-full px- py-1 h-12">
        <CustomText
          as="h1"
          textSize="md"
          textVariant="primary"
          className="font-medium"
        >
          {toHeading(location.pathname)}
        </CustomText>

        <div className="flex items-center gap-6">
          <button onClick={setIsSearchOpen} type="button" className={style}>
            <Search size={20} strokeWidth={strokeWidth} className={iconColor} />
            Search
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={style}
          >
            <Menu size={20} strokeWidth={strokeWidth} className={iconColor} />
            Menu
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {isOpen && (
              <MobileNavigationMenuItems
                isAuthed={isAuthed}
                setIsOpen={() => setIsOpen(false)}
                profile={profile}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileNavigationMenuItems({
  isAuthed,
  setIsOpen,
  profile,
}: {
  isAuthed: boolean;
  setIsOpen: () => void;
  profile: UserProfile | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-40 bg-black/40 justify-center"
      onClick={setIsOpen}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 right-0 z-50 h-full w-60 bg-white shadow-lg "
      >
        <div className="flex items-center justify-between border-b border-neutral-200 pl-6 pr-3 py-2" >
          <CustomText
            textSize="lg"
            textVariant="primary"
            className="font-medium"
          >
            Menu
          </CustomText>
          <CloseBackBtn onClose={setIsOpen} />
        </div>

        <div className="px-4 py-4">
          {isAuthed ? (
            <AuthenticatedNavigation userProfile={profile} />
          ) : (
            <GuestNavigation />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function toHeading(path: string) {
  switch (path) {
    case "/travelers":
      return "Browse travelers";

    case "/parcels":
      return "Browse parcels";

    case "/":
      return "Home";

    case "/requests":
      return "Your requests";
  }
}