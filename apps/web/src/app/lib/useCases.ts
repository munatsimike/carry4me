import { GetTripsUseCase } from "@/app/features/trips/application/GetTripsUseCase";
import { MyTripsUseCase } from "@/app/features/trips/application/MyTripsUseCase";
import { GetTripUseCase } from "@/app/features/trips/application/GetTripUseCase";
import { DeleteTripUseCase } from "@/app/features/trips/application/DeleteTripUseCase";
import { CreateTripUseCase } from "@/app/features/trips/application/CreateTripUsecase";
import { EditTripUsecase } from "@/app/features/trips/application/EditTripUsecase";
import { SupabaseTripsRepository } from "@/app/features/trips/data/SupabaseTripsRepository";

import { GetParcelsUseCase } from "@/app/features/parcels/application/GetParcelsUseCase";
import { MyParcelsIdUseCase } from "@/app/features/parcels/application/MyParcelsUseCase";
import { GetParcelUseCase } from "@/app/features/parcels/application/GetParcelUseCase";
import { DeleteParcelUseCase } from "@/app/features/parcels/application/DeleteParcelUseCase";
import { CreateParcelUseCase } from "@/app/features/parcels/application/CreateParcelUseCase";
import { EditParcelUsecase } from "@/app/features/parcels/application/EditParcelUsecase";
import { SupabaseParcelRepository } from "@/app/features/parcels/data/SupabaseParcelRepository";

import { FetchCarryRequestsUseCase } from "@/app/features/carry request/application/FetchCarryRequestsUseCase";
import { PerformCarryRequestActionUseCase } from "@/app/features/carry request/application/PerformCarryRequestActionUseCase";
import { SupabaseCarryRequestRepository } from "@/app/features/carry request/data/SupabaseCarryRequestRepository";
import { SupabasePerformActionRepository } from "@/app/features/carry request/data/PerformCarryRequestActionRepository";

import { GetNotificationUseCase } from "@/app/features/carry request/carry request events/application/CreateNotificationUseCase";
import { SupabaseNotificationRepository } from "@/app/features/carry request/carry request events/data/SupabaseNotificationRepository";

import { GetDashboardDataUseCase } from "@/app/features/dashboard/application/GetDashboardData";
import { SubabaseDashboardRepository } from "@/app/features/dashboard/data/SupabaseDashboardRepository";

import { GetGoodsUseCase } from "@/app/features/goods/application/GetGoodsUseCase";
import { SaveGoodsUseCase } from "@/app/features/goods/application/SaveGoodsUseCase";
import { EditGoodsUsecase } from "@/app/features/goods/application/EditGoodsUseCase";
import { SupabaseGoodsRepository } from "@/app/features/goods/data/SupabaseGoodsRepository";

import { GetFavouritesUseCase } from "@/app/features/my favourites/application/GetFavouritesUseCase";
import { UpadateFavouriteUseCase } from "@/app/features/my favourites/application/UpdateFavouriteUseCase";
import { SupabaseFavouriteRepository } from "@/app/features/my favourites/data/SupabaseFavouriteRepository";

import { GetLocationUseCase } from "@/app/shared/Authentication/application/GetLocationUseCase";
import { SupabaseLocationRepository } from "@/app/shared/data/SupabaseLocationRepository";

const tripsRepository = new SupabaseTripsRepository();
const parcelsRepository = new SupabaseParcelRepository();
const carryRequestsRepository = new SupabaseCarryRequestRepository();
const performActionRepository = new SupabasePerformActionRepository();
const notificationsRepository = new SupabaseNotificationRepository();
const dashboardRepository = new SubabaseDashboardRepository();
const goodsRepository = new SupabaseGoodsRepository();
const favouritesRepository = new SupabaseFavouriteRepository();
const locationRepository = new SupabaseLocationRepository();

export const getTripsUseCase = new GetTripsUseCase(tripsRepository);
export const myTripsUseCase = new MyTripsUseCase(tripsRepository);
export const getTripUseCase = new GetTripUseCase(tripsRepository);
export const deleteTripUseCase = new DeleteTripUseCase(tripsRepository);
export const createTripUseCase = new CreateTripUseCase(tripsRepository);
export const editTripUseCase = new EditTripUsecase(tripsRepository);

export const getParcelsUseCase = new GetParcelsUseCase(parcelsRepository);
export const myParcelsUseCase = new MyParcelsIdUseCase(parcelsRepository);
export const getParcelUseCase = new GetParcelUseCase(parcelsRepository);
export const deleteParcelUseCase = new DeleteParcelUseCase(parcelsRepository);
export const createParcelUseCase = new CreateParcelUseCase(parcelsRepository);
export const editParcelUseCase = new EditParcelUsecase(parcelsRepository);

export const fetchCarryRequestsUseCase = new FetchCarryRequestsUseCase(
  carryRequestsRepository,
);
export const performCarryRequestActionUseCase =
  new PerformCarryRequestActionUseCase(
    carryRequestsRepository,
    performActionRepository,
    tripsRepository,
    parcelsRepository,
  );

export const getNotificationUseCase = new GetNotificationUseCase(
  notificationsRepository,
);
export const getDashboardDataUseCase = new GetDashboardDataUseCase(
  dashboardRepository,
);

export const getGoodsUseCase = new GetGoodsUseCase(goodsRepository);
export const saveGoodsUseCase = new SaveGoodsUseCase(goodsRepository);
export const editGoodsUseCase = new EditGoodsUsecase(goodsRepository);

export const getFavouritesUseCase = new GetFavouritesUseCase(
  favouritesRepository,
);
export const updateFavouriteUseCase = new UpadateFavouriteUseCase(
  favouritesRepository,
);
export const getLocationUseCase = new GetLocationUseCase(locationRepository);
