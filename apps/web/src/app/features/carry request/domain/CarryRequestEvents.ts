import type { CarryRequestEvent } from "./CarryRequestEvent";

export interface CarryRequestEventRepository{
    createCarryRequestEvent(requestEvent: CarryRequestEvent):Promise<string>
}