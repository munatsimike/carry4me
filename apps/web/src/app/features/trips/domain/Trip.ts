import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import type { User } from "../../../shared/Authentication/domain/AuthRepository";

export type Trip = {
  id: string;
  user: User;
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
