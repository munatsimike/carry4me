import { cn } from "@/app/lib/cn";
import { motion } from "framer-motion";

export type SignInTab = "passkey" | "phone" | "email";

/** Set to `1`, `2`, or `3` to compare tab navigation styles. */
export const SIGN_IN_TAB_NAV_STYLE: 1 | 2 | 3 = 2;

const SIGN_IN_TABS: { id: SignInTab; label: string }[] = [
  { id: "passkey", label: "Passkey" },
  { id: "email", label: "Email OTP" },
  { id: "phone", label: "Phone OTP" },
];

type SignInModalTabsProps = {
  activeTab: SignInTab;
  onTabChange: (tab: SignInTab) => void;
};

export function SignInModalTabs({
  activeTab,
  onTabChange,
}: SignInModalTabsProps) {
  switch (SIGN_IN_TAB_NAV_STYLE) {
    case 2:
      return (
        <SignInModalTabsStyle2 activeTab={activeTab} onTabChange={onTabChange} />
      );
    case 3:
      return (
        <SignInModalTabsStyle3 activeTab={activeTab} onTabChange={onTabChange} />
      );
    default:
      return (
        <SignInModalTabsStyle1 activeTab={activeTab} onTabChange={onTabChange} />
      );
  }
}

function SignInModalTabsStyle1({
  activeTab,
  onTabChange,
}: SignInModalTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
      {SIGN_IN_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "rounded-lg px-2 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-white font-semibold text-primary-800 shadow ring-1 ring-primary-200/90"
              : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-600",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SignInModalTabsStyle2({
  activeTab,
  onTabChange,
}: SignInModalTabsProps) {
  return (
    <div className="rounded-xl bg-neutral-100 p-1">
      <div className="grid grid-cols-3">
        {SIGN_IN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative px-2 pb-2.5 pt-2 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2",
                isActive
                  ? "text-primary-700"
                  : "text-neutral-500 hover:text-neutral-700",
              )}
            >
              <span className={cn(isActive && "font-semibold")}>{tab.label}</span>
              {isActive ? (
                <motion.span
                  layoutId="sign-in-tab-indicator"
                  className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary-600"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Centered chip tabs — active chip gets a light blue pill, inactive stays text-only. */
function SignInModalTabsStyle3({
  activeTab,
  onTabChange,
}: SignInModalTabsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {SIGN_IN_TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200",
              isActive
                ? "border border-primary-200 bg-primary-50 font-semibold text-primary-800 shadow-sm"
                : "border border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
