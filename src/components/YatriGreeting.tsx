import { useEffect, useState } from "react";

/**
 * Time-of-day greeting for the Yatri Cloud audience ("Yatris").
 * Personal, warm brand voice — "Good morning, Yatris 👋" based on the
 * visitor's local time. Purely presentational.
 */
export const getYatriGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

type YatriGreetingProps = {
  /** Override the audience word (defaults to "Yatris"). */
  name?: string;
  /** Show the waving hand. */
  wave?: boolean;
  className?: string;
};

export const YatriGreeting = ({ name = "Yatris", wave = true, className = "" }: YatriGreetingProps) => {
  const [greeting, setGreeting] = useState(getYatriGreeting());

  useEffect(() => {
    setGreeting(getYatriGreeting());
    const id = setInterval(() => setGreeting(getYatriGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className}>
      {greeting}, {name}
      {wave && (
        <>
          {" "}
          <span className="inline-block animate-wave" role="img" aria-label="waving hand">
            👋
          </span>
        </>
      )}
    </span>
  );
};

export default YatriGreeting;
