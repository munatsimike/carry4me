import CustomText from "@/components/ui/CustomText";
import useGreeting from "../shared/Authentication/UI/hooks/useGreeting";

function formatFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function Greeting({ user }: { user: string | null }) {
  const greeting = useGreeting();

  const firstName = user ? formatFirstName(user) : "";

  return (
    <CustomText as="h1" textVariant="primary" textSize="xxl" className="font-medium leading-tight py-2 sm:py-0">
      {greeting} {firstName && `${firstName}!`}
    </CustomText>
  );
}