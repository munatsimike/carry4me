import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { travelers } from "../Data";

export default function TravelersPage() {
  return (
    <DefaultContainer>
      <Travelers travelers={travelers}></Travelers>
    </DefaultContainer>
  );
}
