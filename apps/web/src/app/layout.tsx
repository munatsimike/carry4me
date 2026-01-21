import Navigation from "@/Navigation";
import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <div className="mx-auto max-w-container px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            <img src="/logo.svg" alt="Carry4Me" className="h-14 w-auto" />
          </Link>

          <Navigation userLoggedIn={true} />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
          © {new Date().getFullYear()} Carry4Me
        </div>
      </footer>
    </div>
  );
}
