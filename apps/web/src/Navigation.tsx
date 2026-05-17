import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSignInModal } from "./app/shared/Authentication/SignInModalContext";
import {
  Bell,
  BellRing,
  Handshake,
  HomeIcon,
  LayoutDashboard,
  Package,
  Search,
  Plane,
  ArrowLeft,
  HouseIcon,
} from "lucide-react";
import type { UserProfile } from "./app/shared/Authentication/domain/authTypes";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "./app/components/Toast";
import { useNotifications } from "./app/hooks/queries/useNotificationsQueries";
import { useMarkNotificationsReadMutation } from "./app/hooks/mutations/useNotificationMutations";
import { AnimatePresence, motion } from "framer-motion";
import { UserProfileMenu } from "./app/shared/Authentication/UI/userProfileMenu";
import NotificationPopover from "./app/shared/Authentication/UI/NotificationPopOver";

import CustomText from "./components/ui/CustomText";

import { cn } from "./app/lib/cn";

const iconStyle = "h-5 w-5 stroke-current  sm:hidden";
const strokeWidth = 2;
const bellClass = "h-5 w-5 text-neutral-500 md:h-6 w-6 text-neutral-600";

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
    <nav className="relative flex w-full items-center justify-around gap-1 px-2 text-xs sm:w-auto sm:justify-center sm:gap-5 sm:px-5 sm:py-1 sm:text-sm">
      {children}
    </nav>
  );
}

function GuestNavigation() {
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
      <SignInBtn />
    </NavLinks>
  );
}

function SignInBtn() {
  const { openSignInModal } = useSignInModal();
  const location = useLocation();

  return (
    <div className="flex items-center gap-2">
      {/* SECONDARY ACTION */}
      <button
        onClick={() =>
          openSignInModal({ redirectTo: location.pathname })
        }
        className="
            flex min-h-10 items-center gap-2
            rounded-full bg-blue-500 text-white
            px-3 py-2 sm:px-4
            text-sm sm:text-md font-medium
            transition-all duration-200
            font-heading
            hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-md
            active:scale-95
          "
      >
        Sign in
      </button>
    </div>
  );
}

function AuthenticatedNavigation({ userProfile }: ProfileProps) {
  const [showNotificationPopOver, setShowNotification] =
    useState<boolean>(false);
  const [showPopOver, setShowPrfilePopOver] = useState(false);
  const { toast } = useToast();
  const triggerNotRef = useRef<HTMLButtonElement | null>(null);
  const triggerProfRef = useRef<HTMLButtonElement | null>(null);

  const { data: notifications = [], isError } = useNotifications(
    userProfile?.id ?? undefined,
  );
  const markAllReadMutation = useMarkNotificationsReadMutation();

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.readAt === null),
    [notifications],
  );

  useEffect(() => {
    if (isError) {
      toast("unable to load notifications at the moment", {
        variant: "error",
      });
    }
  }, [isError, toast]);

  useEffect(() => {
    if (!userProfile?.id) return;
    if (unreadNotifications.length > 0 && showNotificationPopOver) {
      markAllReadMutation.mutate(userProfile.id);
    }
  }, [showNotificationPopOver, userProfile?.id, unreadNotifications.length]);

  return (
    <>
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
      </NavLinks>
      <span className="relative mt-4 flex flex-col gap-4 sm:mt-0 sm:flex-row md:items-center">
        <button
          ref={triggerNotRef}
          type="button"
          onClick={() => setShowNotification((prev) => !prev)}
          className="flex justify-start"
        >
          <span className="group inline-flex gap-1">
            <span className="relative flex rounded-full p-1 md:group-hover:bg-neutral-200 gap-2">
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
                      className={cn(bellClass)}
                      strokeWidth={strokeWidth}
                    />
                  ) : (
                    <Bell className={cn(bellClass)} strokeWidth={strokeWidth} />
                  )}
                </motion.span>
              ) : (
                <Bell className={cn(bellClass)} strokeWidth={strokeWidth} />
              )}
              {unreadNotifications.length > 0 && (
                <span className="flex absolute z-10 right-0 top-[-1px] rounded-full h-4 w-4 bg-error-500 text-[11px] text-white justify-center items-center">
                  {unreadNotifications.length}
                </span>
              )}
              <span className="sm:hidden items-center text-neutral-800 hover:text-primary-600">
                Notifications
              </span>
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

        <div className="hidden sm:block">
          <Avatar
            userProfile={userProfile}
            setShowPrfilePopOver={() => setShowPrfilePopOver((v) => !v)}
            triggerProfRef={triggerProfRef}
          />
        </div>

        <AnimatePresence>
          {showPopOver && (
            <UserProfileMenu
              mode="desktop"
              onClosePopOver={setShowPrfilePopOver}
              triggerRef={triggerProfRef}
            />
          )}
        </AnimatePresence>
      </span>
    </>
  );
}

type AvatarProps = {
  userProfile: UserProfile | null;
  setShowPrfilePopOver: () => void;
  triggerProfRef: React.Ref<HTMLButtonElement> | undefined;
};

function Avatar({
  userProfile,
  triggerProfRef,
  setShowPrfilePopOver,
}: AvatarProps) {
  return (
    <button ref={triggerProfRef} type="button" onClick={setShowPrfilePopOver}>
      <img
        src={
          userProfile?.avatarUrl
            ? userProfile.avatarUrl
            : "/user-profile-icon.svg"
        }
        alt="User profile"
        className="rounded-full h-8 w-8 sm:h-9 sm:w-9 border border-neutral-300"
      />
    </button>
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
      end={end}
      className={({ isActive }) =>
        `relative flex min-w-0 flex-1 justify-center sm:w-auto sm:flex-none ${
          isActive
            ? "text-primary-600 font-medium"
            : "text-neutral-700 hover:text-primary-600"
        }`
      }
    >
      {({ isActive }) => (
        <span className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-2">
          <span
            className={`
          flex min-h-10 min-w-0 flex-col items-center justify-center rounded-md px-2 py-1 text-center sm:min-h-0
          ${isActive ? "bg-primary-50 sm:bg-transparent" : ""}
        `}
          >
            {children}
          </span>
        </span>
      )}
    </NavLink>
  );
}

export function MobileToolBar({
  isAuthed,
  profile,
  setIsSearchOpen,
  showSearchBar,
}: {
  showSearchBar: boolean;
  isAuthed: boolean;
  profile: UserProfile | null;
  setIsSearchOpen: () => void;
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const location = useLocation();
  const style =
    "flex min-h-10 flex-col text-neutral-800 items-center justify-center gap-0.5 text-[12px] flex-1 py-1 sm:text-sm";
  const iconColor = "text-neutral-800";
  const HIDE_BACK_ROUTES = ["/", "/dashboard"];
  const showBackButton = !HIDE_BACK_ROUTES.includes(location.pathname);
  const triggerProfRef = useRef<HTMLButtonElement | null>(null);
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };
  return (
    <>
      <div className="relative flex w-full items-center justify-between gap-2 py-1 sm:hidden">
        {showBackButton ? (
          <button
            onClick={() => handleBack()}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <span></span>
        )}
        <CustomText
          as="h1"
          textSize="lg"
          textVariant="primary"
          className="min-w-0 flex-1 truncate text-center font-semibold"
        >
          {toHeading(location.pathname) ?? "Carry4Me"}
        </CustomText>
        <div className="flex min-w-10 items-center justify-end gap-2">
          {showSearchBar && (
            <button onClick={setIsSearchOpen} type="button" className={style}>
              <Search
                size={21}
                strokeWidth={strokeWidth}
                className={iconColor}
              />
            </button>
          )}
          <div className="flex items-center gap-2 sm:hidden">
            <AnimatePresence mode="wait">
              {isAuthed ? (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Avatar
                    triggerProfRef={triggerProfRef}
                    userProfile={profile}
                    setShowPrfilePopOver={() => setIsOpen(true)}
                  />
                </motion.div>
              ) : (
                !showBackButton && (
                  <motion.div
                    key="auth-buttons"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex gap-2 items-center"
                  >
                    <SignInBtn />
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {isOpen && (
        <UserProfileMenu
          mode="mobile"
          onClosePopOver={() => setIsOpen(false)}
          triggerRef={triggerProfRef}
        />
      )}
    </>
  );
}

// mobile bottom navigation menu
export function BottomNavBar({ isAuthed }: { isAuthed: boolean }) {
  return (
    <NavLinks>
      {isAuthed ? (
        <NavItem to="/dashboard">
          {" "}
          <LayoutDashboard className={iconStyle} strokeWidth={strokeWidth} />
          Dashboard
        </NavItem>
      ) : (
        <NavItem to="/">
          {" "}
          <HouseIcon className={iconStyle} strokeWidth={strokeWidth} />
          Home
        </NavItem>
      )}

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
      {isAuthed && (
        <NavItem to="/requests">
          {" "}
          <Handshake className={iconStyle} strokeWidth={strokeWidth} />
          Requests
        </NavItem>
      )}
    </NavLinks>
  );
}

function toHeading(path: string) {
  switch (path) {
    case "/travelers":
      return "Travelers";

    case "/parcels":
      return "Parcels";
    case "/signup":
      return "Signup";
    case "/dashboard":
      return "Dashboard";
    case "/my/trips":
      return "My trips";
    case "/my/parcels":
      return "My Parcels";
    case "/favourites":
      return "My Favourites";
    case "/requests":
      return "Your requests";
  }
}
