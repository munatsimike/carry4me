import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UIContextType = {
  showBottomNavBar: boolean;
  openOverlayCount: number;
  incrementOverlayCount: () => void;
  decrementOverlayCount: () => void;
};

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [openOverlayCount, setOpenOverlayCount] = useState(0);

  const incrementOverlayCount = useCallback(() => {
    setOpenOverlayCount((prev) => prev + 1);
  }, []);

  const decrementOverlayCount = useCallback(() => {
    setOpenOverlayCount((prev) => Math.max(0, prev - 1));
  }, []);

  const value = useMemo(
    () => ({
      openOverlayCount,
      showBottomNavBar: openOverlayCount === 0,
      incrementOverlayCount,
      decrementOverlayCount,
    }),
    [openOverlayCount, incrementOverlayCount, decrementOverlayCount],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIProvider");
  }
  return context;
}