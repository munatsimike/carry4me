import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthModal } from "./app/shared/Authentication/AuthModalContext";
import { Bell } from "lucide-react";
import type { UserProfile } from "./app/shared/Authentication/domain/authTypes";
import { useEffect, useMemo, useRef, useState } from "react";
import { SupabaseNotificationRepository } from "./app/features/carry request/carry request events/data/SupabaseNotificationRepository";
import { GetNotificationUseCase } from "./app/features/carry request/carry request events/application/CreateNotificationUseCase";
import { namedCall } from "./app/shared/Authentication/application/NamedCall";
import { useToast } from "./app/components/Toast";
import type { CarryRequestNotification } from "./app/features/carry request/carry request events/domain/CarryRequestNotification";
import { AnimatePresence } from "framer-motion";
import { UserProfileMenu } from "./app/shared/Authentication/UI/userProfileMenu";
import NotificationPopover from "./app/shared/Authentication/UI/NotificationPopOver";

type ProfileProps = {
  userProfile: UserProfile | null;
};

type NavigationProps = {
  userLoggedIn: boolean;
  userProfile: UserProfile | null;
};

export default function Navigation({
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
    <nav className="flex items-center gap-5 text-sm justify-center">
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
      <NavItem to="/travelers">Trips</NavItem>
      <NavItem to="/parcels">Parcels</NavItem>
      <Link to="signup">
        <button className="text-sm font-medium text-gray-700 hover:text-blue-600">
          Sign up
        </button>
      </Link>
      <button
        onClick={() =>
          openAuthModal({
            mode: "signin",
            redirectTo: location.pathname,
          })
        }
        className="rounded-lg bg-blue-500 px-4 py-1.5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600"
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
      <span className="relative flex gap-5 items-center">
        <NavItem to="/dashboard">Dashboard</NavItem>
        <NavItem to="/travelers">Trips</NavItem>
        <NavItem to="/parcels">Parcels</NavItem>
        <NavItem to="/requests">Requests</NavItem>
        <button
          ref={triggerNotRef}
          type="button"
          onClick={() => setShowNotification((prev) => !prev)}
        >
          <span className=" group inline-flex gap-1 items-center hover:text-primary-600">
            <span className="relative flex rounded-full p-1 group-hover:bg-neutral-200">
              <Bell className="h-6 w-6 text-neutral-600" strokeWidth={1.5} />
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
      </span>
      <span className=" relative inline-flex flex-col">
        <button ref={triggerProfRef} type="button" onClick={() => setShowPrfilePopOver((prev) => !prev)}>
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
        `relative pb-1 ${
          isActive
            ? "text-primary-600 font-medium"
            : "text-neutral-800 hover:text-primary-600"
        }`
      }
      end={end}
    >
      {children}
    </NavLink>
  );
}
