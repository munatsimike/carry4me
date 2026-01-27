import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthModal } from "./app/shared/AuthModalContext";

export default function Navigation({
  userLoggedIn,
  authChecked,
}: {
  userLoggedIn: boolean;
  authChecked: boolean;
}) {
  if (!authChecked) {
    console.log(authChecked)
    return <GuestNavigation />; 
  }
  return userLoggedIn ? <GuestNavigation /> : <GuestNavigation />;
}

function NavLinks({ children }: { children: React.ReactNode }) {
  return <nav className="flex items-center gap-5 text-sm">{children}</nav>;
}

function GuestNavigation() {
  const { openAuthModal } = useAuthModal();
  const location = useLocation();

  return (
    <NavLinks>
      <Home />
      <NavItem to="/about">About</NavItem>
      <NavItem to="/about">Contact</NavItem>
      <button
        onClick={() =>
          openAuthModal({
            mode: "signup",
            redirectTo: location.pathname,
          })
        }
        className="text-sm font-medium text-gray-700 hover:text-blue-600"
      >
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
  return (
    <NavLinks>
      <Home />
      <NavItem to="/dashboard">Dashboard</NavItem>
      <NavItem to="/parcels">Parcels</NavItem>
      <NavItem to="/travelers">Trips</NavItem>
      <NavItem to="/requests">Requests</NavItem>
      <Link to="">
        <img
          src="/avatar.svg"
          alt="User profile"
          className="rounded-full h-9 w-9 border border-neutral-50"
        />
      </Link>
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

