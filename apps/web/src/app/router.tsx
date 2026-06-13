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
import { AuthEntryPage } from "./shared/Authentication/UI/AuthEntryPage";
import CompleteProfile from "./shared/Authentication/UI/CompleteProfilePage";
import {
  CompleteProfileRoute,
  ProtectedRoute,
} from "./shared/Authentication/application/RouteGuards";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import SafetyPage from "./pages/SafetyPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProhibitedItemsPage from "./pages/ProhibitedItemsPage";
import RefundsPage from "./pages/RefundsPage";
import HelpPage from "./pages/HelpPage";
import PricingPage from "./pages/PricingPage";
import HowItWorksPage from "./pages/HowItWorksPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout  />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "how-it-works", element: <HowItWorksPage /> },
      { path: "safety", element: <SafetyPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "prohibited-items", element: <ProhibitedItemsPage /> },
      { path: "refunds", element: <RefundsPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "signin", element: <AuthEntryPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
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
          <ProtectedRoute requireCompleteProfile={false}>
            <CarryRequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute requireCompleteProfile={false}>
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
          <ProtectedRoute requireCompleteProfile={false}>
            <MyTripsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my/parcels",
        element: (
          <ProtectedRoute requireCompleteProfile={false}>
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
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
