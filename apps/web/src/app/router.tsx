import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout";
import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/AboutPage";
import TravelersPage from "./pages/travelers/TravelersPage";
import ParcelsPage from "./pages/parcels/ParcelsPage";
import CarryRequestsPage from "./pages/requests/CarryRequestsPage";
import DashboardPage from "./pages/DashboardPage";
import { AuthModal } from "./features/login/ui/AuthModal";

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
