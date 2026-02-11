import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/AboutPage";
import TravelersPage from "./features/trips/ui/TravelersPage";
import ParcelsPage from "./features/parcels/ui/ParcelsPage";
import CarryRequestsPage from "./features/carry request/ui/CarryRequestsPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import HomePage from "./features/home/HomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "signin", element: <AuthModal /> },
      { path: "travelers", element: <TravelersPage /> },
      { path: "parcels", element: <ParcelsPage /> },
      { path: "requests", element: <CarryRequestsPage /> },
      { path: "dashboard", element: <DashboardPage /> },
    ],
  },
]);
