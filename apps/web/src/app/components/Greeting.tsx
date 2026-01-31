import { useEffect, useState } from "react";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return `Good morning ☀️`;
  if (hour >= 12 && hour < 18) return `Good afternoon 🌤️`;
  return `Good evening 🌙`;
}

export default function Greeting({ user }: { user?: string }) {
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60_000); // update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <h1>
      {greeting} {","} {user}
    </h1>
  );
}
