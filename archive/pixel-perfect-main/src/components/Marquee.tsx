import { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}

export const Marquee = ({
  children,
  speed = "normal",
  direction = "left",
  pauseOnHover = true,
  className = "",
}: MarqueeProps) => {
  const getSpeedClass = () => {
    switch (speed) {
      case "slow":
        return "animate-marquee-slow";
      case "fast":
        return "[animation-duration:15s]";
      default:
        return "animate-marquee";
    }
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`flex ${getSpeedClass()} ${
          direction === "right" ? "[animation-direction:reverse]" : ""
        } ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
      >
        <div className="flex shrink-0 items-center gap-8 pr-8">{children}</div>
        <div className="flex shrink-0 items-center gap-8 pr-8">{children}</div>
      </div>
    </div>
  );
};

export default Marquee;