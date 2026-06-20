import { cn } from "@/app/lib/cn";
import { Fingerprint, Mail, Smartphone, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export type SignInTab = "passkey" | "phone" | "email";

/** Set to `1`, `2`, or `3` to compare tab navigation styles. */
export const SIGN_IN_TAB_NAV_STYLE: 1 | 2 | 3 = 2;

type SignInTabConfig = {
  id: SignInTab;
  label: string;
  icon: LucideIcon;
};

const SIGN_IN_TABS: SignInTabConfig[] = [
  { id: "passkey", label: "Passkey", icon: Fingerprint },
  { id: "email", label: "Email Code", icon: Mail },
  { id: "phone", label: "SMS Code", icon: Smartphone },
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

function SignInTabIcon({
  icon: Icon,
  isActive,
  layout = "stacked",
}: {
  icon: LucideIcon;
  isActive: boolean;
  layout?: "stacked" | "inline";
}) {
  return (
    <Icon
      className={cn(
        "shrink-0",
        layout === "stacked" ? "h-4 w-4" : "h-3.5 w-3.5",
        isActive ? "text-primary-600" : "text-neutral-400",
      )}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

function SignInTabLabel({
  tab,
  isActive,
  layout = "stacked",
}: {
  tab: SignInTabConfig;
  isActive: boolean;
  layout?: "stacked" | "inline";
}) {
  if (layout === "inline") {
    return (
      <span className="inline-flex items-center justify-center gap-1.5">
        <SignInTabIcon icon={tab.icon} isActive={isActive} layout="inline" />
        <span className={cn(isActive && "font-semibold")}>{tab.label}</span>
      </span>
    );
  }

  return (
    <span className="flex flex-col items-center gap-1">
      <SignInTabIcon icon={tab.icon} isActive={isActive} layout="stacked" />
      <span className={cn(isActive && "font-semibold")}>{tab.label}</span>
    </span>
  );
}

function SignInModalTabsStyle1({
  activeTab,
  onTabChange,
}: SignInModalTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
      {SIGN_IN_TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-lg px-2 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-primary-800 shadow ring-1 ring-primary-200/90"
                : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-600",
            )}
          >
            <SignInTabLabel tab={tab} isActive={isActive} layout="stacked" />
          </button>
        );
      })}
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
              <SignInTabLabel tab={tab} isActive={isActive} layout="stacked" />
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
                ? "border border-primary-200 bg-primary-50 text-primary-800 shadow-sm"
                : "border border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
            )}
          >
            <SignInTabLabel tab={tab} isActive={isActive} layout="inline" />
          </button>
        );
      })}
    </div>
  );
}
