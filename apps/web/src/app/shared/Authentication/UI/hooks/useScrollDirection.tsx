import { useEffect, useState } from "react";

const TOP_REVEAL_PX = 40;
const DIRECTION_DELTA_PX = 24;
const LOCK_MS = 400;

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    let lockedUntil = 0;
    let current: "up" | "down" = "up";

    const setDirection = (next: "up" | "down") => {
      if (next === current) return;
      current = next;
      lockedUntil = performance.now() + LOCK_MS;
      setScrollDirection(next);
    };

    const update = () => {
      ticking = false;
      const currentScrollY = Math.max(0, window.scrollY);
      const now = performance.now();

      if (now < lockedUntil) {
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY <= TOP_REVEAL_PX) {
        lastScrollY = currentScrollY;
        setDirection("up");
        return;
      }

      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      if (Math.abs(delta) < DIRECTION_DELTA_PX) return;

      setDirection(delta > 0 ? "down" : "up");
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrollDirection;
}
