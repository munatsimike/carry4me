import { createTrip } from "@/app/auth/data/trips";
import { useEffect } from "react";
import { supabase } from "@/app/auth/client";

export default function TripTest() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const { data, error } = await supabase.auth.getSession();

      console.log("SESSION CHECK:", { data, error });

      if (error) return console.error("getSession error:", error);
      if (!data.session) return console.log("No session yet. Sign in first.");

      console.log("Logged in user:", data.session.user.id);

      try {
        const trip = await createTrip({
          originCountry: "Netherlands",
          originCity: "Amsterdam",
          destinationCountry: "Zimbabwe",
          destinationCity: "Harare",
          departureDate: "2026-02-10",
          capacityKg: 20,
          pricePerKg: 8,
        });

        if (!cancelled) console.log("Trip created:", trip);
      } catch (err) {
        console.error(" Trip error:", err);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return <p className="text-red-500">TripTest mounted</p>;
}
