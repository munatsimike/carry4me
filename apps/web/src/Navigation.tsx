import { NavLink, useLocation } from "react-router-dom";
import { useAuthModal } from "./app/shared/Authentication/AuthModalContext";
import { useState } from "react";

import LogoutButton from "./app/shared/Authentication/UI/LogoutButton";

export default function Navigation({
  userLoggedIn,
  authChecked,
}: {
  userLoggedIn: boolean;
  authChecked: boolean;
}) {
  if (!authChecked) {
    return <GuestNavigation />;
  }
  return userLoggedIn ? <AuthenticatedNavigation /> : <GuestNavigation />;
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
      <NavItem to="/about">About</NavItem>
      <NavItem to="/contact">Contact</NavItem>
      <button className="text-sm font-medium text-gray-700 hover:text-blue-600">
        Sign up
      </button>

      <button
        onClick={() =>
          openAuthModal({
            mode: "signin",
            redirectTo: location.pathname,
          })
        }
        className="rounded-md bg-blue-500 px-4 py-1.5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-600"
      >
        Sign in
      </button>
    </NavLinks>
  );
}

function AuthenticatedNavigation() {
  const [showProfile, setShowProfile] = useState<boolean>(false);
  return (
    <NavLinks>
      <NavItem to="/dashboard">Dashboard</NavItem>
      <NavItem to="/travelers">Trips</NavItem>
      <NavItem to="/parcels">Parcels</NavItem>
      <NavItem to="/requests">Requests</NavItem>
      <button className="relative pb-1 text-neutral-600 font-medium">Notifications</button>
      <span className=" relative inline-flex flex-col">
        <button onClick={() => setShowProfile(!showProfile)}>
          <img
            src="/avatar.svg"
            alt="User profile"
            className="rounded-full h-9 w-9 border border-neutral-50"
          />
        </button>
        {showProfile && <LogoutButton />}
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
