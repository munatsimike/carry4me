import { createBrowserRouter } from "react-router-dom";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/AboutPage";
import TravelersPage from "./features/trips/ui/TravelersPage";
import ParcelsPage from "./features/parcels/ui/ParcelsPage";
import CarryRequestsPage from "./features/carry request/ui/CarryRequestsPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import { AuthModal } from "./shared/Authentication/UI/AuthModal";
import HomePage from "./features/home/HomePage";
import { MyFavouritesPage } from "./features/my favourites/UI/MyFavouritesPage";
import SignUpPage from "./shared/Authentication/UI/SignUpPage";
import ProfilePage from "./shared/Authentication/profile/Profile";
import { MyParcelsPage } from "./features/parcels/MyParcelsPage";
import { MyTripsPage } from "./features/trips/MyTripsPage";
import ResetPassword from "./shared/Authentication/UI/ResetPassword";
import NewPassword from "./shared/Authentication/UI/HandleNewPassword";
import MobileTripShell from "./features/trips/ui/MobileTripShell";
import MobileParcelShaell from "./features/parcels/ui/MobileParcelShell";
import { RootLayout } from "./shared/Authentication/application/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout  />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "signin", element: <AuthModal /> },
      { path: "signup", element: <SignUpPage /> },
      { path: "travelers", element: <TravelersPage /> },
      { path: "parcels", element: <ParcelsPage /> },
      { path: "requests", element: <CarryRequestsPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "favourites", element: <MyFavouritesPage /> },
      { path: "my/trips", element: <MyTripsPage /> },
      { path: "my/parcels", element: <MyParcelsPage /> },
      { path: "update-password", element: <ResetPassword /> },
      { path: "new-password", element: <NewPassword /> },
      { path: "create-trip", element: <MobileTripShell /> },
      { path: "create-parcel", element: <MobileParcelShaell /> },
    ],
  },
]);
