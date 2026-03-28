import CustomText from "@/components/ui/CustomText";
import useGreeting from "../shared/Authentication/UI/hooks/useGreeting";

export default function Greeting({ user }: { user: string | null }) {
  const greeting = useGreeting();

  const firstName = user ? user.split(" ")[0] : "";

  return (
    <CustomText as="h1" textVariant="primary" textSize="xxl" className="font-medium leading-tight">
      {greeting} {firstName && `${firstName}!`}
    </CustomText>
  );
}