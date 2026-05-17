import { createBrowserRouter } from "react-router-dom";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/AboutPage";
import TravelersPage from "./features/trips/ui/TravelersPage";
import ParcelsPage from "./features/parcels/ui/ParcelsPage";
import CarryRequestsPage from "./features/carry request/ui/CarryRequestsPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import HomePage from "./features/home/HomePage";
import { MyFavouritesPage } from "./features/my favourites/UI/MyFavouritesPage";
import ProfilePage from "./shared/Authentication/profile/Profile";
import { MyParcelsPage } from "./features/parcels/MyParcelsPage";
import { MyTripsPage } from "./features/trips/MyTripsPage";
import MobileTripShell from "./features/trips/ui/MobileTripShell";
import MobileParcelShaell from "./features/parcels/ui/MobileParcelShell";
import { RootLayout } from "./shared/Authentication/application/RootLayout";
import { PhoneVerificationModal } from "./shared/Authentication/UI/PhoneVerificationModal";
import CompleteProfile from "./shared/Authentication/UI/CompleteProfilePage";
import {
  CompleteProfileRoute,
  ProtectedRoute,
} from "./shared/Authentication/application/RouteGuards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout  />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "signin", element: <PhoneVerificationModal /> },
      {
        path: "complete-profile",
        element: (
          <CompleteProfileRoute>
            <CompleteProfile />
          </CompleteProfileRoute>
        ),
      },
      { path: "travelers", element: <TravelersPage /> },
      { path: "parcels", element: <ParcelsPage /> },
      {
        path: "requests",
        element: (
          <ProtectedRoute>
            <CarryRequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute blockSuspended={false}>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "favourites",
        element: (
          <ProtectedRoute>
            <MyFavouritesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my/trips",
        element: (
          <ProtectedRoute>
            <MyTripsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my/parcels",
        element: (
          <ProtectedRoute>
            <MyParcelsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "create-trip",
        element: (
          <ProtectedRoute blockPendingReviewActions>
            <MobileTripShell />
          </ProtectedRoute>
        ),
      },
      {
        path: "create-parcel",
        element: (
          <ProtectedRoute blockPendingReviewActions>
            <MobileParcelShaell />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
