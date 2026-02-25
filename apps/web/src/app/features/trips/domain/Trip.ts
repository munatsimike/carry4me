
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";


export type Trip = {
  id: string;
  user: UserProfile;
  acceptedGoods: GoodsCategory[];
  route: {
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
  };
  pricePerKg: number;
  capacityKg: number;
  departDate: string;
  arriveDate?: string | null;
  status: "open" | "closed";
};
